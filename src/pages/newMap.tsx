import { Box, Button, Card, Container, Flex, Heading, ScrollArea, TextField, Text, Radio, Spinner } from "@radix-ui/themes";
import { Checkbox } from "@radix-ui/themes";
import { useRef, useState } from "react";
import supabase from "../supabase";
import { useNavigate } from "react-router";

interface SourceMetadata {
    name: string;
    color: string;
    file: File;
}

interface MapMetadata {
    name: string;
    description: string;
    public: boolean;
}

export default function NewMap() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<MapMetadata>({
        name: "",
        description: "",
        public: false,
    });

    const [sources, setSources] = useState<SourceMetadata[]>([]);

    const inputRef = useRef<HTMLInputElement | null>();

    const [loadingText, setLoadingText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    if (loading) {
        return (
            <Container size="3" style={{ paddingTop: "2rem"}}>
                <ScrollArea>
                    <Flex direction="column" gap="2">
                        <Flex direction={"row"} style={{ paddingBottom: "2%"}}>
                            <Heading>{loadingText}</Heading>
                            <Spinner />
                        </Flex>
                    </Flex>
                </ScrollArea>
            </Container>
        );
    }

    return (
        <Container size="3" style={{ paddingTop: "2rem"}}>
        <ScrollArea>
            <Flex direction="column" gap="2">
                <Flex direction={"row"} style={{ paddingBottom: "2%"}}>
                    <Heading>Create a new map</Heading>
                </Flex>

                <Card>
                    <Flex direction="column" gap="2">
                        <TextField.Root placeholder="Name of the map" onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}></TextField.Root>
                        <TextField.Root placeholder="A description for the map"  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}></TextField.Root>
                        <Flex direction="row" gap="2">
                            <Checkbox onClick={(e) => setFormData((p) => {
                                // @ts-ignore
                                return ({ ...p, public: !p.public });
                            })}></Checkbox>
                            <Text>Make it shareable with the public?</Text>
                        </Flex>
                        <Text>Upload your file (GeoJSON or PMTiles accepted)</Text>
                        <input type="file" style={{ display: "none" }} onChange={(e) => {
                            const files = e.target.files;
                            if (files == null) {
                                return;
                            }
                            const filesMetadata: SourceMetadata[] = [];
                            for (const f of files) {
                                // react batches 
                                filesMetadata.push({ name: f.name, color: "#ffffff", file: f });
                            }
                            setSources((s) => [...filesMetadata]);

                        }} ref={(r) => inputRef.current = r}/>
                        <Button onClick={() => inputRef?.current?.click()}>Upload</Button>
                        { sources.map((source, i) => <Card>
                            <Flex direction="row" gap="2">
                                <Text>{source.name}</Text>
                                <Box style={{ flexGrow: 1 }}></Box>
                                <Text>Color: </Text>
                                <input type="color" value={sources[i].color} onChange={(e) => {
                                    setSources((s) => {
                                        s[i].color = e.target.value;
                                        return [...s];
                                    });
                                }}></input>
                            </Flex>
                        </Card>) }
                        <Button onClick={() => {
                            setLoading(true);
                            createMap(formData, sources, setLoadingText, (id) => navigate(`/viewMap/${id}`));
                        }}>Create</Button>
                    </Flex>
                </Card>
            </Flex>
        </ScrollArea>
    </Container>
    );
}

async function createMap(formData: MapMetadata, sources: SourceMetadata[], setLoadingText: (text: string) => void, redirect: (id: string) => void) {
    const accessToken = (await supabase.auth.getSession()).data.session!.access_token;
    const resp = await fetch("http://localhost:3000/newMap", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
            "Content-Type": "application/json",
            "Authorization": accessToken,
        }
    });

    const { id } = await resp.json();

    for (const source of sources) {
        setLoadingText(`Creating ${source.name}`);

        let format = source.name.split(".").pop();
        if (format !== "pmtiles") {
            format = "geojson";
        }

        const body = JSON.stringify({ mapId: id, name: source.name, color: source.color, format: format });

        const { sourceId, signedUrl, token, path } = await (await fetch("http://localhost:3000/addSource", {
            method: "POST",
            body: body,
            headers: {
                "Content-Type": "application/json",
                "Authorization": accessToken,
            }
        })).json();

        setLoadingText(`Uploading ${source.name}`);

        await supabase.storage.from(format).uploadToSignedUrl(path, token, await source.file.arrayBuffer());
    }

    setLoadingText("Assembling map... converting GeoJSON to PMTiles");

    await fetch("http://localhost:3000/assembleMap", {
        method: "POST",
        body: JSON.stringify({ id }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": accessToken,
        },
    });

    redirect(id);
}