/* eslint-disable react/prop-types */
import { useState, useRef } from "react";
import { Form, useNavigate } from "react-router";

export default function DiscountForm({ discount = {}, errors = {}, isSubmitting = false }) {
  const navigate = useNavigate();
  
  // Client-side state to manage dropdown selection and toggle label helpers
  const [type, setType] = useState(discount.type || "percentage");

  const dateFieldRef = useRef(null);

  const handleClearDate = (e) => {
    e.preventDefault();
    if (dateFieldRef.current) {
      dateFieldRef.current.value = "";
    }
  };

  const isEditing = !!discount.id;

  return (
    <Form method="POST" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px" }}>
      {isEditing && <input type="hidden" name="id" value={discount.id} />}

      {errors.general && (
        <div style={{
          padding: "12px",
          backgroundColor: "#fbeae5",
          color: "#8a1e06",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "500",
        }}>
          {errors.general}
        </div>
      )}

      <div>
        <s-text-field 
          label="Discount code" 
          name="code" 
          defaultValue={discount.code || ""}
          placeholder="e.g. WINTER50" 
          required
        ></s-text-field>
        {!isEditing && (
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6d7175" }}>
            Customers enter this code at checkout.
          </p>
        )}
        {errors.code && (
          <div style={{ color: "#8a1e06", fontSize: "12px", marginTop: "4px" }}>
            {errors.code}
          </div>
        )}
      </div>

      <div>
        <s-select 
          label="Discount type" 
          name="type" 
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <s-option value="percentage">Percentage</s-option>
          <s-option value="fixed">Fixed amount</s-option>
        </s-select>
      </div>

      <div>
        <s-text-field 
          label={`Discount value (${type === "percentage" ? "%" : "$" })`}
          name="value" 
          type="number" 
          defaultValue={discount.value || ""}
          placeholder={type === "percentage" ? "10" : "5.00"}
          required
        ></s-text-field>
        {errors.value && (
          <div style={{ color: "#8a1e06", fontSize: "12px", marginTop: "4px" }}>
            {errors.value}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <s-date-field 
              ref={dateFieldRef}
              label="Expiry date (optional)" 
              name="endsAt" 
              defaultValue={discount.endsAt || ""}
            ></s-date-field>
          </div>
          <s-button variant="tertiary" onClick={handleClearDate}>
            Clear
          </s-button>
        </div>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6d7175" }}>
          Format: YYYY-MM-DD (e.g. 2026-12-31)
        </p>
        {errors.endsAt && (
          <div style={{ color: "#8a1e06", fontSize: "12px", marginTop: "4px" }}>
            {errors.endsAt}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <s-button 
          type="submit" 
          variant="primary" 
          {...(isSubmitting ? { loading: true } : {})}
        >
          Save
        </s-button>
        <s-button 
          variant="tertiary" 
          onClick={() => navigate("/app")}
        >
          Cancel
        </s-button>
      </div>
    </Form>
  );
}
