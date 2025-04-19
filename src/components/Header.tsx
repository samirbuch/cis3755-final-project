import { Title } from "@mantine/core";
import styles from "@/styles/Header.module.css";

export interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}
export default function Header(props: HeaderProps) {
  return (
    <header className={styles.header}>
      <Title>{props.title}</Title>
      {props.children}
    </header>
  )
}