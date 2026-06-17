import { useEffect } from "react";
import { Form, useActionData, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  LIST_DISCOUNTS_QUERY,
  DELETE_CODE_DISCOUNT_MUTATION,
  GET_DISCOUNT_QUERY,
} from "../graphql/discounts";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const createdId = url.searchParams.get("createdId");
  const updatedId = url.searchParams.get("updatedId");
  const targetId = createdId || updatedId;

  const response = await admin.graphql(LIST_DISCOUNTS_QUERY);
  const responseJson = await response.json();
  let discounts = responseJson.data?.codeDiscountNodes?.nodes || [];

  if (targetId) {
    const exists = discounts.some((node) => node.id === targetId);
    if (!exists) {
      try {
        const nodeResponse = await admin.graphql(GET_DISCOUNT_QUERY, {
          variables: { id: targetId },
        });
        const nodeJson = await nodeResponse.json();
        const singleNode = nodeJson.data?.codeDiscountNode;
        if (singleNode) {
          discounts = [singleNode, ...discounts];
        }
      } catch (err) {
        console.error("Failed to fetch target discount:", err);
      }
    } else if (updatedId) {
      // If it exists in the list but was recently updated, index listing might be stale.
      // Fetch fresh version and swap it in.
      try {
        const nodeResponse = await admin.graphql(GET_DISCOUNT_QUERY, {
          variables: { id: updatedId },
        });
        const nodeJson = await nodeResponse.json();
        const freshNode = nodeJson.data?.codeDiscountNode;
        if (freshNode) {
          discounts = discounts.map((node) => node.id === updatedId ? freshNode : node);
        }
      } catch (err) {
        console.error("Failed to fetch fresh updated discount:", err);
      }
    }
  }

  return { discounts };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");
  const id = formData.get("id");

  if (actionType === "delete" && id) {
    try {
      const response = await admin.graphql(DELETE_CODE_DISCOUNT_MUTATION, {
        variables: { id },
      });

      const responseJson = await response.json();
      const result = responseJson.data?.discountCodeDelete;
      const userErrors = result?.userErrors;

      if (userErrors && userErrors.length > 0) {
        return { error: userErrors[0].message };
      }
      return { success: true };
    } catch (err) {
      console.error("Delete failed:", err);
      return { error: "Failed to delete discount." };
    }
  }

  return null;
};

// Helper function to extract and format discount details
function getDiscountDetails(node) {
  const discount = node.codeDiscount;
  if (!discount) return null;

  const code = discount.codes?.nodes?.[0]?.code || "N/A";
  const status = discount.status || "UNKNOWN";
  
  let type = "Basic";
  let value = "N/A";

  if (discount.__typename.includes("Basic") && discount.customerGets?.value) {
    const val = discount.customerGets.value;
    if (val.__typename === "DiscountPercentage" || val.percentage !== undefined) {
      type = "Percentage";
      value = `${Math.round(val.percentage * 100)}%`;
    } else if (val.__typename === "DiscountAmount" || val.amount) {
      type = "Fixed Amount";
      const amountVal = parseFloat(val.amount.amount);
      const currency = val.amount.currencyCode || "USD";
      value = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amountVal);
    }
  } else if (discount.__typename.includes("Bxgy")) {
    type = "Buy X Get Y";
    value = "BXGY";
  } else if (discount.__typename.includes("FreeShipping")) {
    type = "Free Shipping";
    value = "Free";
  }

  return {
    id: node.id,
    code,
    type,
    value,
    status,
    title: discount.title,
  };
}

// Helper to format status badges matching Polaris guidelines
const getStatusBadge = (status) => {
  let backgroundColor = "#e4f0ec";
  let color = "#0d5f47";
  if (status === "EXPIRED") {
    backgroundColor = "#fbeae5";
    color = "#8a1e06";
  } else if (status === "PENDING") {
    backgroundColor = "#fff5ea";
    color = "#824c00";
  }
  
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500",
      backgroundColor,
      color,
      textTransform: "capitalize",
    }}>
      {status.toLowerCase()}
    </span>
  );
};

export default function Index() {
  const { discounts } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Discount deleted");
    } else if (actionData?.error) {
      shopify.toast.show(actionData.error, { isError: true });
    }
  }, [actionData, shopify]);

  return (
    <s-page heading="Discounts" inline-size="large">
      <s-button slot="primary-action" onClick={() => navigate("/app/discounts/new")}>
        Create discount
      </s-button>

      <s-section heading="Manage Store Discounts">
        {discounts.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px dashed #d9d9d9",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏷️</div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 8px 0", color: "#202223" }}>
              Create your first discount code
            </h2>
            <p style={{ color: "#6d7175", maxWidth: "400px", margin: "0 0 16px 0", fontSize: "14px", lineHeight: "20px" }}>
              Generate unique percentage or fixed-amount discount codes to share with your customers and drive sales.
            </p>
            <s-button onClick={() => navigate("/app/discounts/new")}>
              Create discount code
            </s-button>
          </div>
        ) : (
          <s-card>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "14px",
                color: "#202223",
              }}>
                <thead>
                  <tr style={{
                    borderBottom: "1px solid #e1e3e5",
                    background: "#f9fafb",
                  }}>
                    <th style={{ padding: "12px 12px", fontWeight: "600", color: "#6d7175", width: "35%" }}>Code</th>
                    <th style={{ padding: "12px 12px", fontWeight: "600", color: "#6d7175", width: "20%" }}>Type</th>
                    <th style={{ padding: "12px 12px", fontWeight: "600", color: "#6d7175", width: "15%" }}>Value</th>
                    <th style={{ padding: "12px 12px", fontWeight: "600", color: "#6d7175", width: "15%" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#6d7175", textAlign: "right", width: "15%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((node) => {
                    const details = getDiscountDetails(node);
                    if (!details) return null;
                    const displayName = details.code;
                    return (
                      <tr key={details.id} style={{
                        borderBottom: "1px solid #e1e3e5",
                        transition: "background-color 0.2s",
                      }}>
                        <td style={{ padding: "12px 12px", fontWeight: "600", color: "#008060" }}>
                          {displayName}
                        </td>
                        <td style={{ padding: "12px 12px", color: "#6d7175" }}>
                          {details.type}
                        </td>
                        <td style={{ padding: "12px 12px", color: "#202223", fontWeight: "500" }}>
                          {details.value}
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          {getStatusBadge(details.status)}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                            {details.type !== "Buy X Get Y" && details.type !== "Free Shipping" && (
                              <s-button variant="tertiary" onClick={() => navigate(`/app/discounts/edit?id=${details.id}`)}>
                                Edit
                              </s-button>
                            )}
                            <Form method="POST" style={{ display: "inline" }} onSubmit={(e) => {
                              if (!confirm(`Are you sure you want to delete the discount "${displayName}"?`)) {
                                e.preventDefault();
                              }
                            }}>
                              <input type="hidden" name="id" value={details.id} />
                              <input type="hidden" name="_action" value="delete" />
                              <s-button type="submit" variant="tertiary" tone="critical">
                                Delete
                              </s-button>
                            </Form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </s-card>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
