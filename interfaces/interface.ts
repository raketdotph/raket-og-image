export interface Raketeer {
  id: string;
  attributes: {
    username: string;
    seoImage: string | null;
  };
}

export interface Raket {
  data: {
    id: string;
    slug: string;
    seoImage: string | null;
  };
}

export interface Product {
  products: {
    data: Array<{
      id: string;
      attributes: {
        slug: string;
        seoImage: string | null;
      };
    }>;
  };
}

export interface SEOData {
  id: string;
  seoImage: string | null;
  data: Raket | Raketeer | Product;
}
