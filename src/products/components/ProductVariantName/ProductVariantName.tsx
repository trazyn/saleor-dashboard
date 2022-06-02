import { Card, CardContent, TextField } from "@material-ui/core";
import CardTitle from "@saleor/components/CardTitle";
import { ProductErrorFragment } from "@saleor/graphql";
import { FormChange } from "@saleor/hooks/useForm";
import { getFormErrors } from "@saleor/utils/errors";
import React from "react";
import { useIntl } from "react-intl";

import { messages } from "./messages";

interface ProductVariantName {
  data: {
    name: string | null;
  };
  disabled: boolean;
  errors: ProductErrorFragment[];
  onChange: FormChange;
}

const ProductVariantName: React.FC<ProductVariantName> = props => {
  const { data, disabled, errors, onChange } = props;
  const intl = useIntl();
  const formErrors = getFormErrors(["name"], errors);

  return (
    <Card>
      <CardTitle title={<>{intl.formatMessage(messages.variantName)}</>} />
      <CardContent>
        <TextField
          disabled={disabled}
          error={!!formErrors.name}
          type="text"
          fullWidth
          name="name"
          value={data.name || ""}
          label={intl.formatMessage(messages.variantName)}
          helperText={intl.formatMessage(messages.variantNameDescription)}
          onChange={onChange}
          InputProps={{
            inputProps: {
              autoComplete: "none",
              min: 1
            }
          }}
        />
      </CardContent>
    </Card>
  );
};

ProductVariantName.displayName = "ProductVariantName";
export default ProductVariantName;
