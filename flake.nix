{
  description = "LSP bridge for Hoon";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

    parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
  };

  outputs = inputs @ {
    self
    , nixpkgs
    , parts
  }: parts.lib.mkFlake { inherit inputs; } {
    systems = ["x86_64-linux" "aarch64-linux" "aarch64-darwin" "x86_64-darwin"];

    flake = {
      overlays.default = nixpkgs.lib.composeManyExtensions [
        (final: prev: {
          hoon-language-server = final.callPackage ./. { };
        })
      ];
    };

    perSystem = { pkgs, system, ... }: {
      imports = [
        { config._module.args.pkgs = import nixpkgs { inherit system; overlays = [self.overlays.default]; }; }
      ];

      packages.default = pkgs.hoon-language-server;
      apps.default = {
        type = "app";
        program = "${pkgs.hoon-language-server}/bin/hoon-language-server";
      };
    };
  };
}
