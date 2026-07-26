import React from "react";
import styles from "./Button.module.scss";

type ButtonProps = {
    label: string
    type?: "button" | "submit" | "reset" | undefined
    appearance: "typeA" | "typeB" | "typeDanger"
    onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined
    children?:JSX.Element
    disabled?: boolean
}

export default function Button({label, type, appearance, onClick, disabled, children}: ButtonProps) {
  return (
    <button className={styles[appearance]} type={type} disabled={disabled} onClick={onClick}>{label}{children}</button>
  )
}
