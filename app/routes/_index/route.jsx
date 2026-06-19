import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoContainer}>
            <span className={styles.logoIcon}>🏷️</span>
            <span className={styles.logoText}>Discount Manager</span>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.card}>
            <h1 className={styles.heading}>Manage Shopify Discounts</h1>
            <p className={styles.text}>
              A clean and intuitive dashboard to manage, track, and optimize your Shopify store's automatic and code-based discounts.
            </p>

            {showForm && (
              <Form className={styles.form} method="post" action="/auth/login">
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="shop">
                    Shop Domain
                  </label>
                  <input
                    id="shop"
                    className={styles.input}
                    type="text"
                    name="shop"
                    placeholder="my-shop-domain.myshopify.com"
                    required
                  />
                  <span className={styles.helperText}>Enter your shop's Shopify domain to login or install.</span>
                </div>
                <button className={styles.button} type="submit">
                  Connect Store
                </button>
              </Form>
            )}
          </div>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <h3>Centralized Dashboard</h3>
              <p>View, search, and manage all your discount codes and automatic promotions in a single, streamlined view.</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Seamless Integration</h3>
              <p>Directly integrates with the Shopify GraphQL API to perform lightning-fast, secure discount sync operations.</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Built for Scale</h3>
              <p>Optimized database structure ensures persistent settings and fast load times even for high-volume merchants.</p>
            </div>
          </div>
        </main>

        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} Discount Manager. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

