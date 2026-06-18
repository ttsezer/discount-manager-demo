import { useState, useEffect } from "react";
import { Form, useActionData, useLoaderData, useSearchParams, useSubmit } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import styles from "../_index/styles.module.css";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  
  const { errors } = actionData || loaderData;
  const [shop, setShop] = useState(searchParams.get("shop") || "");

  // Auto-submit the login if the shop param is present and there are no validation errors
  useEffect(() => {
    const shopParam = searchParams.get("shop");
    if (shopParam && !errors?.shop) {
      const formData = new FormData();
      formData.append("shop", shopParam);
      submit(formData, { method: "post" });
    }
  }, [searchParams, errors, submit]);

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Log in</h1>
        <p className={styles.text}>Connecting you to your Shopify store...</p>
        
        <Form method="post" className={styles.form}>
          <label className={styles.label}>
            Shop Domain
            <input 
              className={styles.input}
              type="text" 
              name="shop" 
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="example.myshopify.com" 
              required 
            />
            {errors?.shop && (
              <span style={{ color: "#d32f2f", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {errors.shop}
              </span>
            )}
          </label>
          <button className={styles.button} type="submit">
            Log in
          </button>
        </Form>
      </div>
    </div>
  );
}
