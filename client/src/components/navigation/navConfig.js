const navConfig = {
  public: {
    brand: "e-Arthiya",

    main: [
      {
        label: "Home",
        path: "/",
      },
      {
        label: "Marketplace",
        path: "/marketplace",
      },
      {
        label: "How it works",
        path: "/#how-it-works",
      },
      {
        label: "About",
        path: "/#about",
      },
    ],

    cta: {
      label: "Marketplace",
      path: "/marketplace",
    },
  },

  farmer: {
    roleLabel: "Farmer",

    navbar: {
      links: [
        {
          label: "Marketplace",
          path: "/farmer/marketplace",
        },
        {
          label: "Opportunities",
          path: "/farmer/opportunities",
        },
      ],

      action: {
        label: "Add Supply",
        path: "/farmer/supply/add",
      },
    },

    sidebar: {
      sections: [
        {
          title: "WORKSPACE",
          items: [
            {
              label: "Overview",
              path: "/farmer",
              icon: "grid",
            },
            {
              label: "My Supply",
              path: "/farmer/supply",
              icon: "package",
            },
            {
              label: "Buyer Demand",
              path: "/farmer/demand",
              icon: "search",
            },
            {
              label: "Auctions",
              path: "/farmer/auctions",
              icon: "gavel",
            },
          ],
        },

        {
          title: "TRADE",
          items: [
            {
              label: "Commitments",
              path: "/farmer/commitments",
              icon: "file",
            },
            {
              label: "Payments",
              path: "/farmer/payments",
              icon: "wallet",
            },
          ],
        },
      ],
    },
  },

  buyer: {
    roleLabel: "Buyer",

    navbar: {
      links: [
        {
          label: "Marketplace",
          path: "/buyer/marketplace",
        },
        {
          label: "Supply",
          path: "/buyer/supply",
        },
      ],

      action: {
        label: "Post Requirement",
        path: "/buyer/requirements/add",
      },
    },

    sidebar: {
      sections: [
        {
          title: "WORKSPACE",
          items: [
            {
              label: "Overview",
              path: "/buyer",
              icon: "grid",
            },
            {
              label: "My Requirements",
              path: "/buyer/requirements",
              icon: "clipboard",
            },
            {
              label: "Matched Supply",
              path: "/buyer/matches",
              icon: "target",
            },
            {
              label: "Auctions",
              path: "/buyer/auctions",
              icon: "gavel",
            },
            {
              label: "My Bids",
              path: "/buyer/bids",
              icon: "trending",
            },
          ],
        },

        {
          title: "TRADE",
          items: [
            {
              label: "Commitments",
              path: "/buyer/commitments",
              icon: "file",
            },
            {
              label: "Payments",
              path: "/buyer/payments",
              icon: "wallet",
            },
          ],
        },
      ],
    },
  },

  fpo: {
    roleLabel: "FPO",

    navbar: {
      links: [
        {
          label: "Marketplace",
          path: "/fpo/marketplace",
        },
        {
          label: "Demand",
          path: "/fpo/demand",
        },
      ],

      action: {
        label: "Create Supply Pool",
        path: "/fpo/pools/create",
      },
    },

    sidebar: {
      sections: [
        {
          title: "ORGANIZATION",
          items: [
            {
              label: "Overview",
              path: "/fpo",
              icon: "grid",
            },
            {
              label: "Farmers",
              path: "/fpo/farmers",
              icon: "users",
            },
            {
              label: "Supply Pools",
              path: "/fpo/pools",
              icon: "layers",
            },
            {
              label: "Demand",
              path: "/fpo/demand",
              icon: "search",
            },
            {
              label: "Marketplace",
              path: "/fpo/marketplace",
              icon: "store",
            },
          ],
        },

        {
          title: "TRADE",
          items: [
            {
              label: "Commitments",
              path: "/fpo/commitments",
              icon: "file",
            },
            {
              label: "Settlements",
              path: "/fpo/settlements",
              icon: "wallet",
            },
          ],
        },
      ],
    },
  },

  arthiya: {
    roleLabel: "Arthiya",

    navbar: {
      links: [
        {
          label: "Marketplace",
          path: "/arthiya/marketplace",
        },
        {
          label: "Opportunities",
          path: "/arthiya/opportunities",
        },
      ],

      action: {
        label: "Create Supply Pool",
        path: "/arthiya/pools/create",
      },
    },

    sidebar: {
      sections: [
        {
          title: "WORKSPACE",
          items: [
            {
              label: "Overview",
              path: "/arthiya",
              icon: "grid",
            },
            {
              label: "Farmer Network",
              path: "/arthiya/farmers",
              icon: "users",
            },
            {
              label: "Supply",
              path: "/arthiya/supply",
              icon: "package",
            },
            {
              label: "Demand",
              path: "/arthiya/demand",
              icon: "search",
            },
            {
              label: "Supply Pools",
              path: "/arthiya/pools",
              icon: "layers",
            },
          ],
        },

        {
          title: "TRADE",
          items: [
            {
              label: "Market Opportunities",
              path: "/arthiya/opportunities",
              icon: "trending",
            },
            {
              label: "Deals",
              path: "/arthiya/deals",
              icon: "handshake",
            },
            {
              label: "Settlements",
              path: "/arthiya/settlements",
              icon: "wallet",
            },
          ],
        },
      ],
    },
  },
};

export default navConfig;