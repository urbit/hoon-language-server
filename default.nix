{ lib
, nixosTests
, stdenv
, fetchFromGitHub
, makeWrapper
, nodejs
, pkgs
}:

stdenv.mkDerivation rec {
  pname = "hoon-language-server";
  version = "1.1.0";

  nativeBuildInputs = [
    nodejs
    makeWrapper
  ];
  src = ./.;
  buildPhase =
    let
      nodeDependencies = ((import ./node-composition.nix {
        inherit pkgs nodejs;
        inherit (stdenv.hostPlatform) system;
      }).nodeDependencies.override (old: {
        # access to path '/nix/store/...-source' is forbidden in restricted mode
        src = ./.;
        dontNpmInstall = true;
      }));
    in
    ''
      runHook preBuild

      ln -s ${nodeDependencies}/lib/node_modules .
      export PATH="${nodeDependencies}/bin:$PATH"
      npm run build

      runHook postBuild
    '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/share
    cp -a . $out/share/hoon-language-server

    makeWrapper ${nodejs}/bin/node $out/bin/hoon-language-server \
      --add-flags $out/share/hoon-language-server/out/index.js

    runHook postInstall
  '';
}
