export const SHOP_HOST = "shop.dreamplaypianos.com";
export const SHOP_BASE_URL = `https://${SHOP_HOST}`;
export const SHOP_HOME_URL = `${SHOP_BASE_URL}/`;

export const SHOP_LINKS = {
    home: "/customize",
    keyboards: "/customize",
    bundles: "/customize",
    dreamplayOne: "/customize?product=one",
    dreamplayOnePro: "/customize?product=pro",
    benches: "/shop#benches",
} as const;

