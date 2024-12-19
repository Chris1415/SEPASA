import { Box, Center, Heading, Text } from "@chakra-ui/react";
import styles from "./page.module.css";
import PersonalizationTester from "@/components/sitecore/personalizationTester";

export default function Home() {
  return (
    <Box p={14}>
      <Box className={styles.main}>
        <Heading size={"3xl"}>
          <Center>
            (S)itecore (E)mbedded (P)ersonalization (T)esting (A)pplication{" "}
            <Text pl={2} fontWeight={"bold"}>
              (SEPTA)
            </Text>
          </Center>
        </Heading>
        <PersonalizationTester />
      </Box>
      <Box className={styles.footer}></Box>
    </Box>
  );
}
