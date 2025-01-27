import { useParams } from "react-router";
import { Flex, Text, Button, ThemePanel, Heading, Em, Container, Box, Card, Inset, Strong, ScrollArea, Separator } from "@radix-ui/themes";
import { GeolocateControl, Layer, Map, MapGeoJSONFeature, MapRef, NavigationControl, Popup, Source } from "@vis.gl/react-maplibre";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import * as pmtiles from "pmtiles";
import supabase from "./../supabase";
import { useNavigate } from "react-router";
import { layers, useSupabaseSession } from "../utils";
import FeaturesProperties from "../components/featuresProperties";

interface SourceData {
    color: string;
    url: string;
    sourceFile?: pmtiles.PMTiles;
    layers: maplibregl.LayerSpecification[];
}

interface MapData {
    name: string;
    description: string;
    public: boolean;
}

export default function ViewMap() {
    const mapRef = useRef<MapRef | null>(null);
    const [isMountedState, setIsMountedState] = useState(false);

    const [popupFrozen, setPopupFrozen] = useState<boolean>(false);
    const popupFrozenRef = useRef<boolean>();
    popupFrozenRef.current = popupFrozen;

    const [sources, setSources] = useState<SourceData[]>([]);
    const [mapData, setMapData] = useState<MapData>();

    const [popup, setPopup] = useState<any>();
    const [bbox, setBbox] = useState<maplibregl.LngLatBoundsLike>();

    const { id } = useParams();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        const protocol = new pmtiles.Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
    }, []);

    useEffect(() => {
        async function loadMap() {
            try {
                const m1 = (await getMap(id!));
                setMapData({
                    name: m1.name,
                    description: m1.description,
                    public: m1.public,
                })
                const s1 = m1.sources.map((e: any) => ({
                    // @ts-ignore
                    color: e.color,
                    // @ts-ignore
                    url: e.url,
                    sourceFile: undefined,
                    layers: []
                }));
                
                const s2: SourceData[] = [];
                for (const source of s1) {
                    if (source.sourceFile != null) {
                        continue;
                    }
                    const file = new pmtiles.PMTiles(source.url);
                    const ls = await layers(file, source.color);
                    s2.push({
                        ...source,
                        layers: ls,
                        sourceFile: file
                    })
                }
                setSources(s2);
                setLoading(false);
            } catch (error) {
                setError(String(error));
            }
        }

        loadMap();
      }, [id]);

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

    useEffect(() => { (async () => { mergeBboxes(sources, setBbox)})(); }, [sources]);

    useEffect(() => {
        if (mapRef.current == null || bbox === undefined || bbox == null) {
            return;
        }
        const map: maplibregl.Map = mapRef.current.getMap();
        map.fitBounds(bbox, { animate: true, padding: 20, speed: 2.0 });
    }, [bbox]);

    if (error) {
        return (
            <Container size="3" style={{ paddingTop: "2rem"}}>
                <ScrollArea>
                <Flex direction="column" gap="2">
                    <Flex direction={"row"} style={{ paddingBottom: "2%"}}>
                    <Heading>Error: Map not public</Heading>
                    </Flex>
                </Flex>
                </ScrollArea>
            </Container>
            );
    }

    if (loading) {
        return (
        <Container size="3" style={{ paddingTop: "2rem"}}>
            <ScrollArea>
            <Flex direction="column" gap="2">
                <Flex direction={"row"} style={{ paddingBottom: "2%"}}>
                <Heading>Loading...</Heading>
                </Flex>
            </Flex>
            </ScrollArea>
        </Container>
        );
    }

	return (
        <div>
            { mapData && <Container size="3" style={{ paddingTop: "2rem"}}>
                <Flex direction="column" gap="2">
                    <Heading>{mapData.name}</Heading>
                    <Text>{mapData.description}</Text>
                    { mapData && mapData.public && <Button onClick={() =>  navigator.clipboard.writeText(window.location.href)}>Copy link to share</Button>}
                </Flex>
                <Separator size={"4"} my="3" />
                <Map className="map"
                initialViewState={{
                    longitude: -100,
                    latitude: 40,
                    zoom: 3.5
                }}
                style={{width: "100%", height: "80vh"}}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                ref={(ref) => {
                    mapRef.current = ref;
                    if (ref != null) setIsMountedState(true);
                }}>
                <GeolocateControl />
                <NavigationControl />
                {sources.map((source) => {
                return (
                    <Source id="source" type="vector" url={`pmtiles://${source.url}`}>
                        {source.layers.map((layer) => <Layer key={layer.id} {...layer} />)}
                        {popup && popup}
                    </Source>
                    );
                })}
            </Map>
            </Container>}
        </div>
	);
}

async function getMap(id: string) {
    const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

    return fetch(`http://localhost:3000/getMap`, {
        headers: {
            Authorization: accessToken ?? "",
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ id: id }),
    }).then((response) => {
        if (response.ok) {
            return response.json();
        }
    });
}

async function mergeBboxes(sources: SourceData[], setBbox: (bbox: maplibregl.LngLatBoundsLike) => void) {
    const newBbox = [
        [0, 0], // minLon, minLat
        [0, 0], // maxLon, maxLat
    ];

    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const file = source.sourceFile;

        if (file == null) {
            return;
        }

        const fileHeader = await file.getHeader();

        if (i == 0) {
            newBbox[0][0] = fileHeader.minLon;
            newBbox[0][1] = fileHeader.minLat;
            newBbox[1][0] = fileHeader.maxLon;
            newBbox[1][1] = fileHeader.maxLat;
            continue;
        }

        newBbox[0][0] = Math.min(newBbox[0][0], fileHeader.minLon);
        newBbox[0][1] = Math.min(newBbox[0][1], fileHeader.minLat);
        newBbox[1][0] = Math.max(newBbox[1][0], fileHeader.maxLon);
        newBbox[1][1] = Math.max(newBbox[1][1], fileHeader.maxLat);
    }
  
    setBbox(newBbox as maplibregl.LngLatBoundsLike);
}