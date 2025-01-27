# harita-frontend

Harita is a small web app that allows you to create publicly shareable interactive maps for exploring geospatial
datasets. You can upload geospatial data as GeoJSON or PMTiles files and explore each feature by hovering over them.

## Description

It is made up of three parts -- the React frontend, the Express backend, and the Supabase backend. The frontend is a simple React app 
made up of a couple of pages: the introduction screen, the map dashboard, the map creation form, and the map view. It uses Radix UI components
for styling, although the styles are very rough, and MapLibre GL for the map. The Express backend handles the map creation flow and also converts
GeoJSON files to PMTiles, a format that makes geospatial data accessible tile by tile -- thereby making viewing large datasets possible.
Supabase is used as the authentication provider as it allows login through Google (Dartmouth accounts only, but that could be configured).
It is also used as the library to access the PostgreSQL database.

## Setup instructions

### Frontend
Use `bun` to install dependencies.

```
bun i
```

Use `vite` to serve the frontend.

```
vite --cors false
```

The `supabase` client URL and `anon_key` are client-side keys that are hardcoded. This is not a security risk as these are meant to be shipped in
the client code.

### Backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

You also need to have `.env` file or set the environmental variables for the Supabase JWT secret, the Supabase public URL, and the service key.
Checkout `index.ts` to see what environmental variables to set.

## Learning Journey

What inspired me to create this project is my need to work with geospatial data. I built a public transit buses app for Istanbul and one thing
I struggled the most was having a tool to look at geospatial data since the tools were not simple at all. I think an easy-to-use open-source tool
for this can be useful. [geojson.io](https://geojson.io) and [Felt](https://felt.com) are some similar examples -- Felt is a very good tool but unfortunately
it is too expensive for hobbyists.

The internet and open data portals enable people to get access to large datasets, such as Austin's bike-sharing rides dataset or United States Census data.
The intuitive way to analyze these datasets is to visualize it; however, since such geospatial tools are hard to use or expensive, a spreadsheet is the go-to
tool of a lot of people. This tool can serve as a starting point for those efforts.

I used `supabase` for the first time in a project and `express` for the first time in a project of my own. This is also my first time doing a "completed" React project --
excluding my React Native app. I chose `supabase` as a batteries-included platform for authentication, database, and file storage 
-- it packages up a lot of useful infrastructure in a single package in an accessible manner. I also prefered `supabase`
over Firebase as `supabase` is open-source and can be self-hosted. I learned how easy it is to use `supabase` as an auth provider and a database. I could not take
full advantage of its security offerings, such as its row-level security, due to time constraints. My go-to for writing a backend is Python and FastAPI, as it's strong
OpenAPI support makes life much easier. I wanted to try `express` becaues it had been a while since I used Typescript/Javascript to create a backend.

I struggled a lot with how I should design the upload workflow. There are a lot of moving parts in file uploads and creating the database layers, as well as calling
out to third-party tools such as `tippecanoe` to create `PMTiles` from `GeoJSON`. Also, I did not have an idea how to use OpenAPI specification generation with Express --
so wiring up my frontend to my backend took a bit too much time. I did not get around to deploying the project, or removing all the instances of localhost from the codebase. 
I was very used to having OpenAPI specifications ready-to-go through FastAPI that wiring up the APIs manually lost me a solid a hour or so. Although I prefered Typescript with its
strong type system, I struggled with navigating between not having types in the API and Typescript constantly erroring on types. I think Python hits a better balance with this.

Next time, I would definitely prefer to strongly-type my APIs, by generating OpenAPI specifications or using other libraries such as `tRPC`. I would also reduce complexity by
using `supabase`'s row-level security infrastructure, and reduce the number of calls made between the client and the server to create the map from the map creation form.
