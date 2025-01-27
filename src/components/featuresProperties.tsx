import { ScrollArea, Strong, Text } from "@radix-ui/themes";
import { MapGeoJSONFeature } from "@vis.gl/react-maplibre";

// change this to `Data List` component and also add copying from field values
export default function FeaturesProperties(props: { features: MapGeoJSONFeature[] }) {
    return (<ScrollArea type="always" scrollbars="vertical" style={{ maxHeight: 180 }}>
      {props.features.map((f, i) => (
          <div key={i}>
              <Text><Strong>{(f.layer as any)["source-layer"]}</Strong></Text>
              <Text style={{ fontSize: "0.8em" }}> ({f.geometry.type})</Text>
              <table>
                <tbody>
                {Object.entries(f.properties).map(([key, value], i) => (
                  <tr key={i}>
                    <td>{key}</td>
                    <td>
                      {typeof value === "boolean" ? JSON.stringify(value) : value}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
          </div>
        ))}
    </ScrollArea>)
  }