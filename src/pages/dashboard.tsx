import { Box, Button, Card, Container, Dialog, Flex, Heading, Inset, ScrollArea, Separator, Spinner, Text } from "@radix-ui/themes";
import supabase from "../supabase";
import { useNavigate } from "react-router";
import { useSupabaseSession } from "../utils";
import { EyeOpenIcon, TrashIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

interface MapMetadata {
    id: string;
    name: string;
    description: string;
}

interface Map extends MapMetadata {
    sources: Source[];
}

interface Source {
    id: string;
    name: string;
    color: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const session = useSupabaseSession({ loggedOut: () => navigate("/") });
    
    const [maps, setMaps] = useState<MapMetadata[]>();

    useEffect(() => {
        if (!session) {
            return;
        }

        fetch("http://localhost:3000/maps", {
            headers: {
                Authorization: (session as Session).access_token,
            }
        }).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    setMaps(data);
                });
            }
        });
    }, [session])
    

    return (
        <Container size="3" style={{ paddingTop: "2rem"}}>
            <ScrollArea>
                <Flex direction="column" gap="2">
                    <Flex direction={"row"} style={{ paddingBottom: "2%"}}>
                        <Heading>Your Maps</Heading>
                        <Box style={{ flexGrow: 1 }}></Box>
                        <Button onClick={() => navigate("/newMap")}>Make a new map!</Button>
                        <Box style={{ width: "1rem" }}></Box>
                        <Button style={{alignSelf: "center"}} color="red" variant="soft" onClick={() => supabase.auth.signOut()}>Log out?</Button>
                    </Flex>
                    { maps === undefined && <Spinner style={{ alignSelf: "center "}} size="3" /> }
                    { maps && maps.length === 0 && <Text>No maps found. Create a new map!</Text> }
                    { maps && maps.map((map: MapMetadata) => {
                        return (<Card>
                            <Flex direction="row" gap="2">
                                <Heading>{map.name}</Heading>
                                <Box style={{ flexGrow: 1 }}></Box>
                                <Flex direction="row" gap="2">
                                    <Button color="blue" variant="soft" onClick={() => navigate(`/viewMap/${map.id}`)}><EyeOpenIcon /> View</Button>
                                    <Button color="red" variant="soft" onClick={() => {
                                        deleteMap(map.id);
                                        setMaps(maps.filter((m) => m.id !== map.id));
                                    }}><TrashIcon /> Delete</Button>
                                </Flex>
                            </Flex>
                            <Text>{map.description}</Text>
                        </Card>);
                    })}
                </Flex>
            </ScrollArea>
        </Container>
    );
}

async function deleteMap(id: String) {
    const accessToken = (await supabase.auth.getSession()).data.session!.access_token;
    const resp = await fetch("http://localhost:3000/deleteMap", {
        method: "POST",
        body: JSON.stringify({ id: id }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": accessToken,
        }
    });
}