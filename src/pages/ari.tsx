import CenteredOnPage from "@/components/CenteredOnPage";
import { Button, Flex, Text, Title } from "@mantine/core";
import Link from "next/link";
import { ClockLoader } from "react-spinners";

export default function Ari() {
  return (
    <CenteredOnPage>
      <Flex direction={"column"} align="center" gap="md">
        <ClockLoader color="#FFF" size={48} />
        <Title order={2}>Awaiting data...</Title>
        <Text>Come back later</Text>

        <Link href="/" style={{ marginTop: "1rem" }}>
          <Button variant="transparent">
            Try going home
          </Button>
        </Link>
      </Flex>
    </CenteredOnPage>
  )
}