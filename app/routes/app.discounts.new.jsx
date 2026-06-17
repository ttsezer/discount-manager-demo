import { redirect, useActionData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CREATE_BASIC_DISCOUNT_MUTATION } from "../graphql/discounts";
import DiscountForm from "../components/DiscountForm";


export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const code = formData.get("code")?.toString().trim();
  const type = formData.get("type")?.toString();
  const valueRaw = formData.get("value")?.toString();
  const endsAtRaw = formData.get("endsAt")?.toString();

  const errors = {};

  // Input Validation
  if (!code) {
    errors.code = "Discount code is required.";
  } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
    errors.code = "Code can only contain alphanumeric characters, underscores, and dashes.";
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
    today.setHours(0, 0, 0, 0); // Start of today

    if (isNaN(expiryDate.getTime())) {
      errors.endsAt = "Invalid date format.";
    } else if (expiryDate < today) {
      errors.endsAt = "Expiry date cannot be in the past.";
    } else {
      // Set expiry to end of day in UTC
      expiryDate.setHours(23, 59, 59, 999);
      endsAt = expiryDate.toISOString();
    }
  }

  // Return validation errors if any exist
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Prepare input variables for Shopify GraphQL Admin API
  const startsAt = new Date().toISOString();
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
    startsAt,
    customerSelection: { all: true },
    customerGets: {
      value: customerGetsValue,
      items: { all: true }
    },
  };

  if (endsAt) {
    basicCodeDiscount.endsAt = endsAt;
  }

  try {
    const response = await admin.graphql(CREATE_BASIC_DISCOUNT_MUTATION, {
      variables: {
        basicCodeDiscount,
      },
    });

    const responseJson = await response.json();
    const result = responseJson.data?.discountCodeBasicCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      // Map API errors back to the form fields
      result.userErrors.forEach((err) => {
        const fieldName = err.field?.includes("code") ? "code" : err.field?.includes("value") ? "value" : "code";
        errors[fieldName] = err.message;
      });
      return { errors };
    }

    const createdId = result?.codeDiscountNode?.id;

    // Redirect to list page instantly, passing the new ID
    return redirect(`/app?createdId=${encodeURIComponent(createdId)}`);
  } catch (error) {
    console.error("Failed to create discount:", error);
    return {
      errors: {
        general: "An unexpected error occurred. Please try again.",
      },
    };
  }
};

export default function NewDiscount() {
  const actionData = useActionData();
  const navigation = useNavigation();

  const errors = actionData?.errors || {};
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Create discount code" back-url="/app">
      <s-section heading="Discount Details">
        <s-card>
          <DiscountForm errors={errors} isSubmitting={isSubmitting} />
        </s-card>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
