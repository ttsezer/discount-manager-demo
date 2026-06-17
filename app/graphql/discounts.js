export const LIST_DISCOUNTS_QUERY = `#graphql
  query ListDiscountCodes {
    codeDiscountNodes(first: 20, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        codeDiscount {
          __typename
          ... on DiscountCodeBasic {
            title
            status
            startsAt
            endsAt
            codes(first: 1) {
              nodes {
                code
              }
            }
            customerGets {
              value {
                __typename
                ... on DiscountPercentage {
                  percentage
                }
                ... on DiscountAmount {
                  amount {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          ... on DiscountCodeBxgy {
            title
            status
            startsAt
            endsAt
            codes(first: 1) {
              nodes {
                code
              }
            }
          }
          ... on DiscountCodeFreeShipping {
            title
            status
            startsAt
            endsAt
            codes(first: 1) {
              nodes {
                code
              }
            }
          }
        }
      }
    }
  }
`;

export const DELETE_AUTOMATIC_DISCOUNT_MUTATION = `#graphql
  mutation discountAutomaticDelete($id: ID!) {
    discountAutomaticDelete(id: $id) {
      deletedAutomaticDiscountId
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_CODE_DISCOUNT_MUTATION = `#graphql
  mutation discountCodeDelete($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_BASIC_DISCOUNT_MUTATION = `#graphql
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_DISCOUNT_QUERY = `#graphql
  query GetDiscount($id: ID!) {
    codeDiscountNode(id: $id) {
      id
      codeDiscount {
        __typename
        ... on DiscountCodeBasic {
          title
          status
          startsAt
          endsAt
          codes(first: 1) {
            nodes {
              code
            }
          }
          customerGets {
            value {
              __typename
              ... on DiscountPercentage {
                percentage
              }
              ... on DiscountAmount {
                amount {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const UPDATE_BASIC_DISCOUNT_MUTATION = `#graphql
  mutation discountCodeBasicUpdate($id: ID!, $basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicUpdate(id: $id, basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;
