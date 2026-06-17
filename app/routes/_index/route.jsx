import { redirect } from "react-router";
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
  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>You are not supposed to see this page! :(</h1>
      </div>
    </div>
  );
}
