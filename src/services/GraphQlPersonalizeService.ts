import "@sitecore-cloudsdk/personalize/browser";
import "@sitecore-cloudsdk/events/browser";
import { gql } from "@apollo/client";
import { personalize } from "@sitecore-cloudsdk/personalize/browser";
import {
  ExperienceParams,
  PersonalizeExecution,
  PersonalizeInfo,
  PersonalizeQueryResult,
} from "@/types/sitecore";
import { DEFAULT_VARIANT } from "@/consts/sitecore";
import client from "@/lib/Apollo/client";

const personalizeInfoQuery = gql`
  query ($siteName: String!, $language: String!, $itemPath: String!) {
    layout(site: $siteName, routePath: $itemPath, language: $language) {
      item {
        id
        version
        personalization {
          variantIds
        }
      }
    }
  }
`;

export function getComponentFriendlyId(
  pageId: string,
  componentId: string,
  language: string,
  scope?: string
): string {
  const formattedPageId = pageId.replace(/[{}-]/g, "");
  const formattedComponentId = componentId.replace(/[{}-]/g, "");
  const formattedLanguage = language.replace("-", "_");
  const scopeId = scope ? `${normalizeScope(scope)}_` : "";
  return `component_${scopeId}${formattedPageId}_${formattedComponentId}_${formattedLanguage}*`.toLowerCase();
}

// CDP Helper 2
function normalizeScope(scope?: string): string {
  return scope?.replace(/[^a-zA-Z0-9]+/g, "") || "";
}
// CDP Helper 1
function getPageFriendlyId(
  pageId: string,
  language: string,
  scope?: string
): string {
  const formattedPageId = pageId.replace(/[{}-]/g, "");
  const formattedLanguage = language.replace("-", "_");
  const scopeId = scope ? `${normalizeScope(scope)}_` : "";
  return `embedded_${scopeId}${formattedPageId}_${formattedLanguage}`.toLowerCase();
}

// Personalize
export async function executePersonalize({
  params,
  friendlyId,
  language,
  timeout,
  variantIds,
  country,
}: {
  params: ExperienceParams;
  friendlyId: string;
  language: string;
  timeout?: number;
  variantIds?: string[];
  country: string;
}) {
  const result = await personalize(
    {
      channel: "WEB",
      currency: "USD",
      friendlyId,
      params,
      language,
      pageVariantIds: variantIds,
      geo: { country: country },
      email: undefined,
      identifier: undefined,
    },
    { timeout }
  );
  return result as {
    variantId: string;
    message: string;
  };
}

// Peronalization Execution
export function getPersonalizeExecutions(
  personalizeInfo: PersonalizeInfo,
  language: string
): PersonalizeExecution[] {
  if ((personalizeInfo?.variantIds?.length ?? 0) === 0) {
    return [];
  }
  const results: PersonalizeExecution[] = [];
  return personalizeInfo.variantIds.reduce((results, variantId) => {
    if (variantId.includes("_")) {
      // Component-level personalization in format "<ComponentID>_<VariantID>"
      const componentId = variantId.split("_")[0];
      const friendlyId = getComponentFriendlyId(
        personalizeInfo.pageId,
        componentId,
        language
      );
      const execution = results.find((x) => x.friendlyId === friendlyId);
      if (execution) {
        execution.variantIds.push(variantId);
      } else {
        // The default/control variant (format "<ComponentID>_default") is also a valid value returned by the execution
        const defaultVariant = `${componentId}${DEFAULT_VARIANT}`;
        results.push({
          friendlyId,
          variantIds: [defaultVariant, variantId],
        });
      }
    } else {
      // Embedded (page-level) personalization in format "<VariantID>"
      const friendlyId = getPageFriendlyId(personalizeInfo.pageId, language);
      const execution = results.find((x) => x.friendlyId === friendlyId);
      if (execution) {
        execution.variantIds.push(variantId);
      } else {
        results.push({
          friendlyId,
          variantIds: [variantId],
        });
      }
    }
    return results;
  }, results);
}
// Personalize Info
export async function GetPersonalizationInfo(
  siteName: string,
  itemPath: string,
  language: string
): Promise<PersonalizeInfo> {
  const data = await client.query<PersonalizeQueryResult>({
    query: personalizeInfoQuery,
    variables: {
      siteName: siteName,
      itemPath: itemPath,
      language: language,
    },
  });

  const personalizeInfo = (
    data?.data?.layout?.item
      ? {
          pageId: data?.data?.layout.item.id,
          variantIds: data?.data?.layout.item.personalization.variantIds,
        }
      : undefined
  ) as PersonalizeInfo;

  return personalizeInfo;
}
