import { createListCollection } from "@chakra-ui/react";

export const DEFAULT_VARIANT = "_default";
export const GRAPHQL_LAYOUT_QUERY_NAME = "JssLayoutQuery";
export const HIDDEN_RENDERING_NAME = "Hidden Rendering";
export const COUNTIRES = createListCollection({
  items: [
    { label: "Germany", value: "DE" },
    { label: "Austria", value: "AT" },
    { label: "Afghanistan", value: "AF" },
  ],
});

export const LANGUAGES = createListCollection({
  items: [
    { label: "German", value: "de-DE" },
    { label: "English", value: "en" },
    { label: "French", value: "fr-FR" },
  ],
});
