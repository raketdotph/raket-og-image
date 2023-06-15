export interface Raketeer {
  id: string;
  attributes: {
    username: string;
    ogImage: {
      data: {
        id: string;
        attributes: {
          url: string;
        };
      } | null;
    };
  };
}

export interface Raket {
  data: {
    id: string;
    ogImage: {
      data: {
        id: string;
        attributes: {
          url: string;
        };
      } | null;
    };
    seoImage: string | null;
  };
}

export interface Product {
  products: {
    data: Array<{
      id: string;
      attributes: {
        slug: string;
        ogImage: {
          data: {
            id: string;
            attributes: {
              url: string;
            };
          } | null;
        };
      };
    }>;
  };
}

export interface SEOData {
  id: string;
  userId: string;
  ogImage: string | null;
  data: Raket | Raketeer | Product;
}
