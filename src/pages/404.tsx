import CenteredOnPage from "@/components/CenteredOnPage";
import { Button, Flex, Text, Title } from "@mantine/core";
import Link from "next/link";
import { ClockLoader } from "react-spinners";

export default function NotFound() {
  return (
    <CenteredOnPage>
      <Flex direction={"column"} align="center">
        <ClockLoader color="#FFF" size={50} />
        <Title mt={"lg"}>404</Title>
        <Text>You look lost.</Text>
        <Link href="/" style={{ marginTop: "1rem" }}>
          <Button variant="transparent">Try going home</Button>
        </Link>
      </Flex>
    </CenteredOnPage>
  )
}