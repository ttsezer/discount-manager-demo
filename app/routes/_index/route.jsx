import { Form, redirect } from "react-router";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function App() {
  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Shopify Discount Manager</h1>
        <p className={styles.text}>Enter your shop address to log in or install the application.</p>
        
        <Form method="GET" className={styles.form}>
          <label className={styles.label}>
            Shop Domain
            <input 
              className={styles.input}
              type="text" 
              name="shop" 
              placeholder="example.myshopify.com" 
              required 
            />
          </label>
          <button className={styles.button} type="submit">
            Install / Log In
          </button>
        </Form>
      </div>
    </div>
  );
}
