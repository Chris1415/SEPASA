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

export async function GetFlowDefinition(flowId: string | undefined) {
  // Not working with an unstable bearer token; The proper authentication is not documented
  // if (!flowId) {
  //   return {};
  // }
  // const url =
  //   "https://api-engage-eu.sitecorecloud.io/v3/flowDefinitions/" + flowId;
  // const token =
  //   "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InpnbnhyQk9IaXJ0WXp4dnl1WVhNZyJ9.eyJodHRwczovL2F1dGguc2l0ZWNvcmVjbG91ZC5pby9jbGFpbXMvdGVuYW50X2lkIjoiYmUwNDNhMmYtZjAwOC00YjVlLWMzNDYtMDhkYmYwZjQ4OGJkIiwiaHR0cHM6Ly9hdXRoLnNpdGVjb3JlY2xvdWQuaW8vY2xhaW1zL3RlbmFudF9uYW1lIjoic2l0ZWNvcmVzYWFlYmRiLWNoYWgtZGV2Iiwic2Nfc3lzX2lkIjoiNTkwNzYzN2MtY2RkZi00OGU5LWFjZWYtYmQwNmYxYTZiYWI4IiwiaHR0cHM6Ly9hdXRoLnNpdGVjb3JlY2xvdWQuaW8vY2xhaW1zL29yZ19pZCI6Im9yZ19ZcjBlOExhZFExYnhCMDVzIiwiaHR0cHM6Ly9hdXRoLnNpdGVjb3JlY2xvdWQuaW8vY2xhaW1zL3RlbmFudC9jZHBfY2xpZW50X2tleSI6IjZkNWEwOGU2NTM4NTM2NGM1M2U1NjIwYjY4OGI1MTUxIiwiaHR0cHM6Ly9hdXRoLnNpdGVjb3JlY2xvdWQuaW8vY2xhaW1zL29yZ19uYW1lIjoic2l0ZWNvcmUtc2Fhcy1vcHMtc2FsZXMtZW5naW5lZXJzLTciLCJodHRwczovL2F1dGguc2l0ZWNvcmVjbG91ZC5pby9jbGFpbXMvb3JnX2Rpc3BsYXlfbmFtZSI6IlNhbGVzIEVuZ2luZWVycyA3IiwiaHR0cHM6Ly9hdXRoLnNpdGVjb3JlY2xvdWQuaW8vY2xhaW1zL29yZ19hY2NvdW50X2lkIjoiMDAxMU4wMDAwMVV0SFlXUUEzIiwiaHR0cHM6Ly9hdXRoLnNpdGVjb3JlY2xvdWQuaW8vY2xhaW1zL29yZ190eXBlIjoiaW50ZXJuYWwiLCJodHRwczovL2F1dGguc2l0ZWNvcmVjbG91ZC5pby9jbGFpbXMvZW1haWwiOiJjaHJpc3RpYW4uaGFobkBzaXRlY29yZS5jb20iLCJodHRwczovL2F1dGguc2l0ZWNvcmVjbG91ZC5pby9jbGFpbXMvcm9sZXMiOlsiW0dsb2JhbF1cXEV2ZXJ5b25lIiwiW09yZ2FuaXphdGlvbl1cXE9yZ2FuaXphdGlvbiBBZG1pbiJdLCJodHRwczovL2F1dGguc2l0ZWNvcmVjbG91ZC5pby9jbGFpbXMvY2xpZW50X25hbWUiOiJQYWdlcyIsImlzcyI6Imh0dHBzOi8vYXV0aC5zaXRlY29yZWNsb3VkLmlvLyIsInN1YiI6ImF1dGgwfDYyYjE3ZGRlOTViMzQyNDBhYTU4MmY0ZiIsImF1ZCI6WyJodHRwczovL2FwaS13ZWJhcHAuc2l0ZWNvcmVjbG91ZC5pbyIsImh0dHBzOi8vb25lLXNjLXByb2R1Y3Rpb24uZXUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTczNDUwNzc3NCwiZXhwIjoxNzM0NTA4Njc0LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIGlhbS51c3I6ciBpYW0udXNyOncgaWFtLnVzcl9vcmdzOnIgYmFja2JvbmUuZXZlbnRzOnJlYWQgY29ubmVjdC50b2tlbnM6Y3JlYXRlIGNvbm5lY3QucG9ydGFsOnJlYWQgcGxhdGZvcm0ucmVnaW9uczpsaXN0IGlhbS5vcmc6ciBpYW0ub3JnOncgaWFtLm9yZ19jb25zOnIgaWFtLm9yZ19jb25zOncgaWFtLm9yZ19pbnZzOnIgaWFtLm9yZ19pbnZzOncgaWFtLm9yZ19tYnJzOnIgaWFtLm9yZ19tYnJzOncgaWFtLm9yZ19tYnJzX3JvbGVzOncgaWFtLnJvbGVzOnIgaWFtLnVzcl9yb2xlczpyIHhtY2xvdWRkZXBsb3kucHJvamVjdHM6bWFuYWdlIHhtY2xvdWRkZXBsb3kuZW52aXJvbm1lbnRzOm1hbmFnZSB4bWNsb3VkZGVwbG95Lm9yZ2FuaXphdGlvbnM6bWFuYWdlIHhtY2xvdWRkZXBsb3kuZGVwbG95bWVudHM6bWFuYWdlIHhtY2xvdWRkZXBsb3kubW9uaXRvcmluZy5kZXBsb3ltZW50czpyZWFkIHhtY2xvdWRkZXBsb3kuY2xpZW50czptYW5hZ2UgeG1jbG91ZGRlcGxveS5zb3VyY2Vjb250cm9sOm1hbmFnZSB4bWNsb3VkZGVwbG95LnJoOm1uZyB4bWNsb3VkZGVwbG95LnNpdGU6bW5nIHhtY2xvdWQuY206YWRtaW4geG1jbG91ZC5jbTpsb2dpbiBjb25uZWN0LndlYmhvb2tzOnJlYWQgY29ubmVjdC53ZWJob29rczpjcmVhdGUgY29ubmVjdC53ZWJob29rczp1cGRhdGUgY29ubmVjdC53ZWJob29rczpkZWxldGUgcGxhdGZvcm0udGVuYW50czpsaXN0YWxsIGJhY2tib25lLmV2ZW50czplbmFibGUgYmFja2JvbmUuZXZlbnRzOmRpc2FibGUgdWkuZXh0ZW5zaW9uczpyZWFkIGVkZ2UudG9rZW5zOmNyZWF0ZSBlZGdlLnRva2VuczpyZWFkIGVkZ2UudG9rZW5zOmRlbGV0ZSBlZGdlLnRva2Vuczp1cGRhdGUgaGMubWdtbnQudHlwZXM6d3JpdGUgaGMubWdtbnQuYXBpa2V5czptYW5hZ2UgaGMubWdtbnQudHlwZXM6cmVhZCBoYy5tZ21udC5tZWRpYTptYW5hZ2UgaGMubWdtbnQuc3RhdGVzOnB1Ymxpc2ggaGMubWdtbnQuaXRlbXM6bWFuYWdlIGhjLm1nbW50LnVzZXJzOnJlYWQgaGMubWdtbnQuY2xpZW50czpyZWFkIGhjLm1nbW50LnRheG9ub21pZXM6cmVhZCBoYy5tZ21udC50YXhvbm9taWVzOndyaXRlIGhjLm1nbW50LmxvY2FsZXM6ciBoYy5tZ21udC5sb2NhbGVzOncgaGMubWdtbnQuc2V0dGluZ3M6ciBoYy5tZ21udC5zZXR0aW5nczptIG1tcy51cGxvYWQuZmlsZTphZGQgbW1zLnVwbG9hZC5maWxlOnJlbW92ZSBjbXAuc2l0ZXM6Y3JlYXRlIGNtcC5zaXRlczpyZWFkIGNtcC5jb2xsZWN0aW9uczpjcmVhdGUgY21wLmNvbGxlY3Rpb25zOnJlYWQgY21wLmNvbGxlY3Rpb25zOmRlbGV0ZSBjbXAuY29tcG9uZW50czpjcmVhdGUgY21wLmNvbXBvbmVudHM6cmVhZCBjbXAuY29tcG9uZW50czpkZWxldGUgY21wLmRhdGFzb3VyY2VzOmNyZWF0ZSBjbXAuZGF0YXNvdXJjZXM6cmVhZCBjbXAuZGF0YXNvdXJjZXM6ZGVsZXRlIGNtcC5zdHlsZXM6cmVhZCBjbXAuc3R5bGVzOnVwZGF0ZSBjbXAuc3R5bGVzOmRlbGV0ZSBjbXAucHJveHk6cmVhZCBjbXAuYmxvYnM6Y3JlYXRlIHN1cHBvcnQudGlja2V0czpjcmVhdGUgc2VhcmNoLnBvcnRhbDptYW5hZ2Ugc2VhcmNoLmRpc2NvdmVyOm1hbmFnZSBzZWFyY2guYWRtaW46bWFuYWdlIHNlYXJjaC5pbnRlcm5hbDptYW5hZ2Ugc2VhcmNoLnV0aWw6bWFuYWdlIHNlYXJjaC5hY2NvdW50Om1hbmFnZSBkaXNjb3Zlci5wb3J0YWw6bWFuYWdlIGRpc2NvdmVyLnNlYXJjaC1yZWM6bWFuYWdlIGRpc2NvdmVyLmFkbWluOm1hbmFnZSBkaXNjb3Zlci5pbnRlcm5hbDptYW5hZ2UgZGlzY292ZXIudXRpbDptYW5hZ2UgZGlzY292ZXIuZXZlbnQ6bWFuYWdlIGRpc2NvdmVyLmFjY291bnQ6bWFuYWdlIGZvcm1zLmVuZHBvaW50czpyZWFkIGZvcm1zLmVuZHBvaW50czpjcmVhdGUgZm9ybXMuZW5kcG9pbnRzOnVwZGF0ZSBmb3Jtcy5lbmRwb2ludHM6ZGVsZXRlIGZvcm1zLnN1Ym1pc3Npb25zOnJlYWQgZm9ybXMuc3VibWlzc2lvbnM6Y3JlYXRlIGZvcm1zLnN1Ym1pc3Npb25zOnVwZGF0ZSBmb3Jtcy5zdWJtaXNzaW9uczpkZWxldGUgZm9ybXMuZXhwb3J0czpjcmVhdGUgZm9ybXMuZXhwb3J0czpyZWFkIGF1ZGl0LmxvZ3M6ciBjb25uZWN0Lm9yZzpyIGNvbm5lY3Qub3JnLnRudDpyIGNvbm5lY3QucmNwOmMgY29ubmVjdC5yY3A6ciBjb25uZWN0LnJjcDp1IGNvbm5lY3QucmNwOmQgY29ubmVjdC5jb246YyBjb25uZWN0LmNvbjpyIGNvbm5lY3QuY29uOnUgY29ubmVjdC5jb246ZCBjb25uZWN0LmZsZHI6YyBjb25uZWN0LmZsZHI6ciBjb25uZWN0LmZsZHI6ZCBjb25uZWN0LmxjbC5pbXA6YyBjb25uZWN0LmxjbC5pbXA6ciBjb25uZWN0LmxjbC5leHA6YyBjb25uZWN0LmxjbC5leHA6ciBjb25uZWN0LnByb2o6ciBjb25uZWN0LnByb2o6ZCBlcC5hZG1uLm9yZ3MuaHN0bm1lOnIgZXAuYWRtbi5vcmdzLmhzdG5tZTp3IGVwLnVzci5jdHg6ciBlcC51c3IuY3R4OncgZXAudXNyLmN0eF9yZXM6ciBlcC51c3IuY3R4X3Jlczp3IHhtYXBwcy5jb250ZW50OmdlbiBhaS5vcmcuYnJkOmwgYWkub3JnLmJyZDpyIGFpLm9yZy5icmQ6dyBhaS5vcmcuZWc6ciBhaS5vcmcuZWc6dyBhaS5vcmcuY2h0czpyIGFpLm9yZy5jaHRzOncgYWkub3JnLmRvY3M6ciBhaS5vcmcuZG9jczp3IGFpLm9yZy5icmk6ciBhaS5vcmcuYnJpOncgYWkuZ2VuLmNtcDpyIGFpLmdlbi5jbXA6dyBhaS5yZWMudmFyOncgYWkucmVjLnZhcjpyIGFpLnJlYy5oeXA6dyBhaS5yZWMuaHlwOnIgYWkub3JnOmFkbWluIGFpLm9yZzp1c2VyIG1tcy5kZWxpdmVyeTpyIGNzLmFsbDplZGl0b3IgY3MuYWxsOmFkbWluIHhtY3B1Yi5xdWV1ZTpyIHhtY3B1Yi5qb2JzLmE6dyB4bWNwdWIuam9icy5hOnIgbWtwLmFwcHM6ciBta3AuYXBwczp3IG1rcC5jbGllbnRzOnIgbWtwLmNsaWVudHM6dyBta3AuYXBwaW5zdGxzOnIgbWtwLmFwcGluc3Rsczp3IiwiYXpwIjoicFFsVE1NUUNVTkxoa202Wm1HZVhhdmNnSHdwMHJlMUMifQ.STNnxFS54I18bKpINFi-EUFrW7wh1-i5wFXhv7n2PGcrlTP2G_nWDQ5jwAvduo0XX9mHTwuzs5hOdFkNt38l8tEkOHGn28xmOt_7aI-td3SterBhdo9tIR8taFIcNLbBdnQEx9mAy-LwWiHDrc8GsKAmbagSdvUlSV8_w6LHfJtgRL6TNg_xNjXeaSIiBy9_pobRYDhqpIfaG8Wx_8OrxuXESt874eEWYVcOupSV9RnDu8OLr1xtcAnUnYcosLDtvUIDS7-XZzK3Tfgv8YPM59k8mCB-P4kQRbfZDOCVH9Mi3qxpcnPQ9NLp5rK6jzMLry5QQ9IOl3ictQRarrBsMQ";

  // const data = await fetch(url, {
  //   headers: {
  //     Authorization: "Bearer " + token,
  //   },
  // });

  // const jsonData = await data.json();
  // return jsonData;
  return flowId;
}

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
  console.log("Personalize: " + JSON.stringify(result, null, 2));
  return result as {
    variantId: string;
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
