import { Flex, Text, Button, ThemePanel, Heading, Em, Container, Box, Card, Inset, Strong, ScrollArea, Separator } from "@radix-ui/themes";
import { GeolocateControl, Layer, Map, MapGeoJSONFeature, MapRef, NavigationControl, Popup, Source } from "@vis.gl/react-maplibre";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import * as pmtiles from "pmtiles";
import supabase from "./../supabase";
import { useNavigate } from "react-router";
import { layers, useSupabaseSession } from "../utils";
import FeaturesProperties from "../components/featuresProperties";

export default function Index() {
  const mapRef = useRef<MapRef | null>(null);
  const [isMountedState, setIsMountedState] = useState(false);

  const [popupFrozen, setPopupFrozen] = useState<boolean>(false);
  const popupFrozenRef = useRef<boolean>();
  popupFrozenRef.current = popupFrozen;

  const [source, setSource] = useState<string>("migros_tr.pmtiles");
  const [sourceFile, setSourceFile] = useState<pmtiles.PMTiles>();
  const [sourceLayers, setSourceLayers] = useState<maplibregl.LayerSpecification[]>([]);

  const [popup, setPopup] = useState<any>();
  const navigate = useNavigate();
  const session = useSupabaseSession({ loggedIn: () => navigate("/dashboard") });

  useEffect(() => {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }, []);

  useEffect(() => {
    if (!isMountedState) {
      return;
    }

    const map: maplibregl.Map = mapRef.current!.getMap();

    map.on("mousemove", (e: any) => {
      if (popupFrozenRef.current) {
        return;
      }

      const { x, y } = e.point;
      const r = 2; // radius around the point
      let features = map.queryRenderedFeatures([
        [x - r, y - r],
        [x + r, y + r],
      ]);

      // ignore the basemap
      features = features.filter((feature) => feature.source === "source");

      if (!features.length) {
        setPopup(undefined)
      } else {
        setPopup(
          <Popup longitude={e.lngLat.lng} latitude={e.lngLat.lat} closeButton={false} closeOnClick={false} style={{ color: "black" }}>
            <FeaturesProperties features={features}/>
          </Popup>
        );
      }
    });

    map.on("click", (e) => {
      setPopupFrozen((p) => !p);
    });
  }, [isMountedState]);

  useEffect(() => {
    const file = new pmtiles.PMTiles(source);
    layers(file, "#ff7f00").then((layers) => {setSourceLayers(layers); setSourceFile(file);});
  }, [source]);

  useEffect(() => {
    if (mapRef.current == null) {
      return;
    }

    const map: maplibregl.Map = mapRef.current.getMap();
    sourceFile?.getHeader().then((header) => {
      map.fitBounds([
        [header.minLon, header.minLat],
        [header.maxLon, header.maxLat],
      ], { animate: true, padding: 20, speed: 2.0 });
    });
    
  }, [sourceFile, isMountedState]);

	return (
    <Container size="3" style={{ paddingTop: "2rem"}}>
      <Flex direction="column" gap="2">
        <Heading size="8">Harita</Heading>
        <Text>share geospatial data on maps!</Text>
        <Card size="2">
          <Inset clip="padding-box" side="top" pb="current">
          <Map className="map"
              initialViewState={{
                longitude: -100,
                latitude: 40,
                zoom: 3.5
              }}
              style={{width: "100%", height: "500px"}}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
              ref={(ref) => {
                mapRef.current = ref;
                if (ref != null) setIsMountedState(true);
              }}>
            <GeolocateControl />
            <NavigationControl />
            <Source id="source" type="vector" url={`pmtiles://${source}`}>
              {sourceLayers.map((layer) => <Layer key={layer.id} {...layer} />)}
              {popup && popup}
            </Source>
          </Map>
          </Inset>
          <Text as="p" size="3">
            <Strong>This example map</Strong> displays all the branches of the Migros supermarket chain in Turkey. Hover over the the points to see the properties of the features, and click to freeze the popup.
          </Text>
        </Card>
        <Separator my="3" size="4" />
        <Text>Would you like to create such maps?</Text>
        <Button style={{ width: "50%", alignSelf: "center"}} onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Log in with Google (requires a Dartmouth account)</Button>
		  </Flex>
    </Container>
	);
}