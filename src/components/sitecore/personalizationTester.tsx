"use client";
import { CloudSDK } from "@sitecore-cloudsdk/core/browser";
import "@sitecore-cloudsdk/personalize/browser";
import "@sitecore-cloudsdk/events/browser";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExperienceParams, LayoutServiceData } from "@/types/sitecore";
import { Button } from "@/components/ui/button";
import {
  executePersonalize,
  GetFlowDefinition,
  GetPersonalizationInfo,
  getPersonalizeExecutions,
} from "@/services/GraphQlPersonalizeService";
import {
  fetchLayoutData,
  fetchSiteInfos,
  fetchSiteRoutes,
} from "@/services/GraphQlXmcService";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { COUNTIRES, LANGUAGES } from "@/consts/sitecore";
import {
  Center,
  createListCollection,
  GridItem,
  Heading,
  ListCollection,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import {
  PersonalizationComparison,
  personalizeLayout,
} from "@/services/PersonalizationService";
import { pageView } from "@sitecore-cloudsdk/events/browser";
import { getGuestId } from "@sitecore-cloudsdk/core/browser";
// import { getGuestId, getBrowserId } from "@sitecore-cloudsdk/core/browser";

export default function PersonalizationTester() {
  const query = useSearchParams();
  const [allVariants, setAllVariants] = useState<string[] | null>();
  const [chosenVariant, setChosenVariant] = useState<string[] | null>();
  const [layoutData, setLayoutData] = useState<LayoutServiceData>();
  //   const [personalizedLayoutData, setPersonalizedLayoutData] =
  //     useState<LayoutServiceData>();
  const [personalizedComponents, setPersonalizedComponents] =
    useState<PersonalizationComparison[]>();
  const [siteName, setSiteName] = useState<string>("Sitecore_Community_Demo");
  const [allSites, setAllSites] =
    useState<ListCollection<{ label: string; value: string }>>();
  const [allRoutes, setAllRoutes] =
    useState<ListCollection<{ label: string; value: string }>>();
  const [allRoutesForCdp, setAllRoutesForCdp] =
    useState<ListCollection<{ label: string; value: string }>>();
  const [path, setPath] = useState<string>("/");
  const [language, setLanguage] = useState<string>("en");
  const [country, setCountry] = useState<string>("DE");
  const [pathForEvent, setPathForEvent] = useState<string>("/");
  const [guesId, setGuesId] = useState<string>();

  function AddPathToViewEvents() {
    pageView({
      channel: "WEB",
      currency: "USD",
      page: pathForEvent,
      language,
      includeUTMParameters: true,
    });
  }

  useEffect(() => {
    async function GetSites() {
      const sites = await fetchSiteInfos();

      const mappedSitesList = createListCollection({
        items: sites.map((element) => {
          return { label: element.name, value: element.name };
        }),
      });

      setAllSites(mappedSitesList);
    }

    GetSites();
  }, []);

  useEffect(() => {
    async function GetRoutes() {
      const routes = await fetchSiteRoutes(siteName);

      let mappedRoutes = createListCollection({
        items: routes.map((element) => {
          return {
            label: element.route.name,
            value: element.routePath,
          };
        }),
      });

      setAllRoutes(mappedRoutes);

      mappedRoutes = createListCollection({
        items: routes.map((element) => {
          return {
            label: element.routePath,
            value: element.route.name,
          };
        }),
      });

      setAllRoutesForCdp(mappedRoutes);
    }

    GetRoutes();
  }, [siteName]);

  useEffect(() => {
    const utm = {
      campaign: query.get("utm_campaign") || undefined,
      content: query.get("utm_content") || undefined,
      medium: query.get("utm_medium") || undefined,
      source: query.get("utm_source") || undefined,
    };

    // Cloud SDK Initialization
    CloudSDK({
      sitecoreEdgeContextId: process.env.NEXT_PUBLIC_CONTEXTID ?? "",
      siteName: siteName,
      enableBrowserCookie: true,
    })
      .addPersonalize({
        enablePersonalizeCookie: true,
        webPersonalization: true,
      })
      .addEvents()
      .initialize();
    // *****

    async function SetGuesId() {
      setGuesId(await getGuestId());
    }

    SetGuesId();

    // ASYNC PART ****** //
    async function Personalize() {
      // Grab the informatuion if variants exist and which ones
      const personalizeInfo = await GetPersonalizationInfo(
        siteName,
        path,
        language
      );
      console.log(
        "personalizeInfo: " + JSON.stringify(personalizeInfo, null, 2)
      );

      // Transform the data to a format Personalize understands
      const personalizationExecutions = await getPersonalizeExecutions(
        personalizeInfo,
        language
      );
      console.log(
        "personalizationExecutions: " +
          JSON.stringify(personalizationExecutions, null, 2)
      );

      setAllVariants(personalizationExecutions?.at(0)?.variantIds);

      // Get additional Information about the flow definition (Currently not working)
      const flowDefinition = await GetFlowDefinition(
        personalizationExecutions?.at(0)?.friendlyId
      );
      console.log("flowDefinition: " + JSON.stringify(flowDefinition, null, 2));

      // Identify which variant/audience should be applied as personalization
      const identifiedVariantIds: string[] = [];
      await Promise.all(
        personalizationExecutions.map((execution) =>
          executePersonalize({
            params: { utm: utm, referrer: "" } as ExperienceParams,
            friendlyId: execution.friendlyId,
            variantIds: execution.variantIds,
            language,
            country,
          }).then((personalization) => {
            console.log(
              "executePersonalizeResult: " +
                JSON.stringify(personalization, null, 2)
            );
            const variantId = personalization.variantId;
            if (variantId) {
              if (!execution.variantIds.includes(variantId)) {
              } else {
                identifiedVariantIds.push(variantId);
              }
            }
          })
        )
      );

      console.log("identifiedVariantIds: " + identifiedVariantIds);
      if (identifiedVariantIds.length > 0) {
        setChosenVariant(identifiedVariantIds);
      } else {
        setChosenVariant(undefined);
      }

      // Get Standard Layout Response
      const layoutData = await fetchLayoutData(siteName, path, language);
      console.log(JSON.stringify(layoutData, null, 2));
      if (layoutData) {
        setLayoutData(layoutData);
      }

      if (identifiedVariantIds.length > 0) {
        const personalizedComponents: PersonalizationComparison[] = [];
        personalizeLayout(
          layoutData,
          identifiedVariantIds?.at(0) ?? "",
          personalizedComponents,
          []
        );
        // setPersonalizedLayoutData(layoutData);
        setPersonalizedComponents(personalizedComponents);
      } else {
        // setPersonalizedLayoutData(undefined);
        setPersonalizedComponents(undefined);
      }
    }

    Personalize();
  }, [language, path, query, siteName, country]);

  return (
    <>
      <div>
        <Heading>Input</Heading>
        <div>
          <SimpleGrid columns={[1, null, 3]}>
            <GridItem p={4}>
              <SelectRoot
                value={[siteName]}
                onValueChange={(e) => setSiteName(e.value.at(0) ?? "DE")}
                mt={2}
                collection={
                  allSites ??
                  createListCollection({
                    items: [],
                  })
                }
                size="md"
              >
                <SelectLabel>Select Site</SelectLabel>
                <SelectTrigger>
                  <SelectValueText p={2} placeholder="No site selected" />
                </SelectTrigger>
                <SelectContent p={2}>
                  {allSites?.items?.map((site) => (
                    <SelectItem item={site} key={site.value}>
                      {site.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </GridItem>
            <GridItem p={4}>
              <SelectRoot
                value={[language]}
                onValueChange={(e) => setLanguage(e.value.at(0) ?? "en")}
                mt={2}
                collection={LANGUAGES}
                size="md"
              >
                <SelectLabel>Select Language</SelectLabel>
                <SelectTrigger>
                  <SelectValueText p={2} placeholder="No language selected" />
                </SelectTrigger>
                <SelectContent p={2}>
                  {LANGUAGES.items.map((language) => (
                    <SelectItem item={language} key={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </GridItem>
            <GridItem p={4}>
              <SelectRoot
                value={[path]}
                onValueChange={(e) => setPath(e.value.at(0) ?? "/")}
                mt={2}
                collection={allRoutes ?? createListCollection({ items: [] })}
                size="md"
              >
                <SelectLabel>Select path</SelectLabel>
                <SelectTrigger>
                  <SelectValueText p={2} placeholder="No path selected" />
                </SelectTrigger>
                <SelectContent p={2}>
                  {allRoutes?.items?.map((route) => (
                    <SelectItem item={route} key={route.value}>
                      {route.value} ({route.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              {/* <Field
                mt={2}
                label="Path"
                required
                helperText="Enter an Item path from Sitecore"
              >
                <Input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  p={3}
                  placeholder="Enter path"
                />
              </Field> */}
            </GridItem>
          </SimpleGrid>{" "}
          <hr />
          <SimpleGrid columns={[1, null, 3]}>
            <GridItem p={4}>
              <SelectRoot
                value={[country]}
                onValueChange={(e) => setCountry(e.value.at(0) ?? "DE")}
                mt={2}
                collection={COUNTIRES}
                size="md"
              >
                <SelectLabel>Select Country</SelectLabel>
                <SelectTrigger>
                  <SelectValueText p={2} placeholder="No country selected" />
                </SelectTrigger>
                <SelectContent p={2}>
                  {COUNTIRES.items.map((country) => (
                    <SelectItem item={country} key={country.value}>
                      {country.value} ({country.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </GridItem>
            <GridItem p={4}>
              <SelectRoot
                value={[pathForEvent]}
                onValueChange={(e) => {
                  setPathForEvent(e.value.at(0) ?? "Home");
                }}
                mt={2}
                collection={
                  allRoutesForCdp ?? createListCollection({ items: [] })
                }
                size="md"
              >
                <SelectLabel>Add path to journey</SelectLabel>
                <SelectTrigger>
                  <SelectValueText p={2} placeholder="No path selected" />
                </SelectTrigger>
                <SelectContent p={2}>
                  {allRoutesForCdp?.items?.map((route) => (
                    <SelectItem item={route} key={route.value}>
                      {route.value} ({route.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              <Button onClick={() => AddPathToViewEvents()}>Add</Button>
            </GridItem>
          </SimpleGrid>
        </div>
        <div></div>
      </div>

      <hr />

      <SimpleGrid>
        <GridItem columns={[1, null, 5]}>
          <div>
            <Heading> Current Site </Heading>
            {siteName == null ? "No site active" : siteName}
          </div>
          <div>
            <Heading> Current Path </Heading>
            {path == null ? "No path active" : path}
          </div>
          <div>
            <Heading> Current Language </Heading>
            {language == null ? "No language active" : language}
          </div>
          <div>
            <Heading> Current Country </Heading>
            {country == null ? "No country active" : country}
          </div>
          <div>
            <Heading> CDP / P Guest ID </Heading>
            {guesId}
          </div>
        </GridItem>
      </SimpleGrid>

      <hr />

      <div>
        <Heading> Available Variants({allVariants?.length}) </Heading>

        {allVariants == null ? "(No variants found)" : allVariants.join(" | ")}
      </div>

      <div>
        <Heading> Active Variant is: </Heading>

        {chosenVariant == null ? "(No active variant found)" : chosenVariant}
      </div>

      <hr />

      <div>
        <Heading>Standard Layout Response is:</Heading>
        <div>
          {layoutData == null
            ? "... no data for " + path
            : JSON.stringify(layoutData, null, 2)}
        </div>
      </div>

      <div>
        <Heading>Personalized Layout Response:</Heading>
        There is currently an issue replacing the real content with personalize
        one
        {/* <div>
          {personalizedLayoutData == null
            ? "... no data for " + path
            : JSON.stringify(personalizedLayoutData, null, 2)}
        </div> */}
      </div>
      <div>
        <Heading>Personalized Components comparison</Heading>
        <div>
          {personalizedComponents == null ? (
            <>... no data for {path}</>
          ) : (
            <SimpleGrid columns={[1, null, 2]}>
              <GridItem
                p={2}
                border={"solid"}
                backgroundColor={"black"}
                color={"white"}
                m={2}
              >
                <Center>
                  <Text>Original Content</Text>
                </Center>
              </GridItem>
              <GridItem
                p={2}
                border={"solid"}
                backgroundColor={"black"}
                color={"white"}
                m={2}
              >
                <Center>
                  <Text>Personalized Content </Text>
                </Center>
              </GridItem>
              {personalizedComponents.map((element) => {
                return (
                  <>
                    <GridItem p={2} border={"solid"} m={2}>
                      {JSON.stringify(element.original, null, 2)}
                    </GridItem>
                    <GridItem p={2} border={"solid"} m={2}>
                      {JSON.stringify(element.personalized, null, 2)}
                    </GridItem>
                  </>
                );
              })}
            </SimpleGrid>
          )}
        </div>
      </div>
    </>
  );
}
