import { redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { GET_DISCOUNT_QUERY, UPDATE_BASIC_DISCOUNT_MUTATION } from "../graphql/discounts";
import DiscountForm from "../components/DiscountForm";


export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return redirect("/app");
  }

  try {
    const response = await admin.graphql(GET_DISCOUNT_QUERY, {
      variables: { id },
    });

    const responseJson = await response.json();
    const node = responseJson.data?.codeDiscountNode;

    if (!node || node.codeDiscount?.__typename !== "DiscountCodeBasic") {
      return redirect("/app");
    }

    const discount = node.codeDiscount;
    const code = discount.codes?.nodes?.[0]?.code || "";
    
    let type = "percentage";
    let value = "";

    if (discount.customerGets?.value) {
      const val = discount.customerGets.value;
      if (val.__typename === "DiscountPercentage" || val.percentage !== undefined) {
        type = "percentage";
        value = (val.percentage * 100).toString();
      } else if (val.__typename === "DiscountAmount" || val.amount) {
        type = "fixed";
        value = val.amount.amount;
      }
    }

    // Format endsAt to YYYY-MM-DD for the s-date-field defaultValue
    let endsAt = "";
    if (discount.endsAt) {
      endsAt = discount.endsAt.split("T")[0];
    }

    return {
      id,
      code,
      type,
      value,
      endsAt,
    };
  } catch (error) {
    console.error("Failed to load discount for editing:", error);
    return redirect("/app");
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const id = formData.get("id")?.toString();
  const code = formData.get("code")?.toString().trim();
  const type = formData.get("type")?.toString();
  const valueRaw = formData.get("value")?.toString();
  const endsAtRaw = formData.get("endsAt")?.toString();

  if (!id) {
    return redirect("/app");
  }

  const errors = {};

  // Input Validation
  if (!code) {
    errors.code = "Discount code is required.";
  }

  const value = parseFloat(valueRaw);
  if (isNaN(value) || value <= 0) {
    errors.value = "Value must be a positive number greater than 0.";
  } else if (type === "percentage" && value > 100) {
    errors.value = "Percentage value cannot be greater than 100%.";
  }

  let endsAt = null;
  if (endsAtRaw) {
    const expiryDate = new Date(endsAtRaw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(expiryDate.getTime())) {
      errors.endsAt = "Invalid date format.";
    } else if (expiryDate < today) {
      errors.endsAt = "Expiry date cannot be in the past.";
    } else {
      expiryDate.setHours(23, 59, 59, 999);
      endsAt = expiryDate.toISOString();
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Prepare variables
  const title = type === "percentage" ? `${value}% Off - ${code}` : `$${value} Off - ${code}`;

  const customerGetsValue = type === "percentage" 
    ? { percentage: value / 100 }
    : {
        discountAmount: {
          amount: value,
          appliesOnEachItem: false
        }
      };

  const basicCodeDiscount = {
    title,
    code,
    customerGets: {
      value: customerGetsValue,
      items: { all: true }
    },
    endsAt, // Send null if expired is cleared
  };

  try {
    const response = await admin.graphql(UPDATE_BASIC_DISCOUNT_MUTATION, {
      variables: {
        id,
        basicCodeDiscount,
      },
    });

    const responseJson = await response.json();
    const result = responseJson.data?.discountCodeBasicUpdate;

    if (result?.userErrors && result.userErrors.length > 0) {
      result.userErrors.forEach((err) => {
        const fieldName = err.field?.includes("code") ? "code" : err.field?.includes("value") ? "value" : "code";
        errors[fieldName] = err.message;
      });
      return { errors };
    }

    // Redirect to list page instantly, passing the updated ID
    return redirect(`/app?updatedId=${encodeURIComponent(id)}`);
  } catch (error) {
    console.error("Failed to update discount:", error);
    return {
      errors: {
        general: "An unexpected error occurred. Please try again.",
      },
    };
  }
};

export default function EditDiscount() {
  const discount = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const errors = actionData?.errors || {};
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Edit discount code" back-url="/app">
      <s-section heading="Discount Details">
        <s-card>
          <DiscountForm discount={discount} errors={errors} isSubmitting={isSubmitting} />
        </s-card>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
