import styles from "./Modal.module.css";
import { FaSolidXmark } from "solid-icons/fa";
import type { JSX } from "solid-js/jsx-runtime";

export function Modal(props: {
  children: JSX.Element;
  close: () => void;
  class?: string;
  title: string;
}) {
  const close = () => props.close();

  return (
    <>
      <div class={styles.Modal__paranja} onClick={close} />
      <div class={styles.Modal}>
        <div class={styles.Modal__header}>
          <button type="button" onClick={close} class={styles.Modal__close}>
            <FaSolidXmark />
          </button>
          {props.title}
        </div>
        <div class={`${styles.Modal__content} ${props.class || ""}`}>
          {props.children}
        </div>
      </div>
    </>
  );
}
