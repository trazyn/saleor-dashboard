import {
  BulkAttributeValueInput,
  ProductVariantBulkCreateInput
} from "@saleor/graphql";

import {
  Attribute,
  ChannelPrice,
  Price,
  ProductVariantCreateFormData,
  Stock
} from "./form";

interface CreateVariantAttributeValueInput {
  attributeId: string;
  attributeValueSlug: string | null;
  attributeBooleanValue: boolean | null;
}

type CreateVariantInput = CreateVariantAttributeValueInput[];

function findAttribute(
  attributes: CreateVariantInput,
  stockOrPrice: Stock | Price
) {
  return attributes.find(
    attribute => attribute.attributeId === stockOrPrice.attribute
  );
}

function getAttributeValueStock(
  attributes: CreateVariantInput,
  stock: Stock
): number[] {
  const attribute = findAttribute(attributes, stock);

  const attributeValue = stock.values.find(
    attributeValue => attribute.attributeValueSlug === attributeValue.slug
  );

  return attributeValue.value;
}

function getAttributeValuePrice(
  attributes: CreateVariantInput,
  price: Price
): ChannelPrice[] {
  const attribute = findAttribute(attributes, price);

  const attributeValue = price.values.find(
    attributeValue => attribute.attributeValueSlug === attributeValue.slug
  );

  return attributeValue.value;
}

function getStockFromMode(
  attributes: CreateVariantInput,
  stock: Stock,
  skipValue: number[]
): number[] {
  switch (stock.mode) {
    case "all":
      return stock.value;
    case "attribute":
      return getAttributeValueStock(attributes, stock);
    case "skip":
      return skipValue;
  }
}

function getPriceFromMode(
  attributes: CreateVariantInput,
  price: Price,
  skipValue: ChannelPrice[]
): ChannelPrice[] {
  switch (price.mode) {
    case "all":
      return price.channels;
    case "attribute":
      return getAttributeValuePrice(attributes, price);
    case "skip":
      return skipValue;
  }
}

function getAttributeFromAttributeValueInput({
  attributeId,
  attributeBooleanValue,
  attributeValueSlug
}: CreateVariantAttributeValueInput): BulkAttributeValueInput {
  if (attributeBooleanValue === null) {
    return {
      id: attributeId,
      values: attributeValueSlug === null ? [] : [attributeValueSlug]
    };
  }
  return {
    id: attributeId,
    boolean: attributeBooleanValue
  };
}

function createVariant(
  data: ProductVariantCreateFormData,
  attributes: CreateVariantInput
): ProductVariantBulkCreateInput {
  const price = getPriceFromMode(
    attributes,
    data.price,
    data.price.channels.map(channel => ({ ...channel, price: "" }))
  );
  const stocks = getStockFromMode(
    attributes,
    data.stock,
    data.warehouses.map(() => 0)
  );

  return {
    name: data.name,
    attributes: attributes.map(getAttributeFromAttributeValueInput),
    channelListings: price,
    sku: "",
    stocks: stocks.map((quantity, stockIndex) => ({
      quantity,
      warehouse: data.warehouses[stockIndex]
    }))
  };
}

function addAttributeToVariant(
  attribute: Attribute,
  variant: CreateVariantInput
): CreateVariantInput[] {
  if (attribute.values.length === 0) {
    return [
      [
        ...variant,
        {
          attributeId: attribute.id,
          attributeValueSlug: null,
          attributeBooleanValue: null
        }
      ]
    ];
  }
  return attribute.values.map(attributeValue => [
    ...variant,
    {
      attributeId: attribute.id,
      attributeValueSlug: attributeValue.slug,
      attributeBooleanValue: attributeValue.value?.boolean ?? null
    }
  ]);
}
function addVariantAttributeInput(
  data: CreateVariantInput[],
  attribute: Attribute
): CreateVariantInput[] {
  return data
    .map(variant => addAttributeToVariant(attribute, variant))
    .reduce((acc, variantInput) => [...acc, ...variantInput]);
}

export function createVariantFlatMatrixDimension(
  variants: CreateVariantInput[],
  attributes: Attribute[]
): CreateVariantInput[] {
  if (attributes.length > 0) {
    return createVariantFlatMatrixDimension(
      addVariantAttributeInput(variants, attributes[0]),
      attributes.slice(1)
    );
  } else {
    return variants;
  }
}

export function createVariants(
  data: ProductVariantCreateFormData
): ProductVariantBulkCreateInput[] {
  if (
    (data.price.mode === "attribute" && !data.price.attribute) ||
    (data.stock.mode === "attribute" && !data.stock.attribute)
  ) {
    return [];
  }
  const variants = createVariantFlatMatrixDimension(
    [[]],
    data.attributes
  ).map(variant => createVariant(data, variant));

  return variants;
}
