/**
 * This is a url to the tax page: /taxes/channels/{taxConfigurationId}
 * However, when we load the page for the first time we don't know
 * the first taxConfigurationId, we need to query it first. So this hook
 * redirects from generic url (/taxes/channels/) to the one with id.
 * Its use is similar in countries and tax classes views.
 */

import { UseNavigatorResult } from "@saleor/hooks/useNavigator";
import React from "react";

interface TaxEntityWithId {
  id: string;
}
interface TaxEntityWithCode {
  countryCode: string;
}

type TaxEntity = TaxEntityWithId | TaxEntityWithCode;

interface UseTaxUrlRedirectOpts {
  id: string;
  data: TaxEntity[];
  navigate: UseNavigatorResult;
  urlFunction: (id: string) => string;
}

export function useTaxUrlRedirect({
  id,
  data,
  navigate,
  urlFunction
}: UseTaxUrlRedirectOpts): void {
  React.useEffect(() => {
    if (id === "undefined" && data) {
      const defaultTaxEntity = data[0];
      if ("id" in defaultTaxEntity) {
        navigate(urlFunction(defaultTaxEntity.id));
      }
      if ("countryCode" in defaultTaxEntity) {
        navigate(urlFunction(defaultTaxEntity.countryCode));
      }
    }
  }, [id, data]);
}
