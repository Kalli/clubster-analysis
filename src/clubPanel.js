import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import BarChart from "./BarChart";
import { fillColor, artistLink } from "./lib";

const Club = (props) => {
  const { club } = props;
  const imgPath = `${process.env.PUBLIC_URL}/img/`;
  const img =
    club.logo === "" ? (
      <div className={"placeholder"} />
    ) : (
      <div className={"image center"}>
        <img src={imgPath + club.logo.split("/").slice(-1)[0]} alt={props.id} />
      </div>
    );
  const color = fillColor(club.group, props.categories);
  const link = "https://www.residentadvisor.net/club.aspx?id=" + club.club_id;

  return (
    <div key={club.club_id} className={"clubPanel"}>
      <button
        className={"clubButton"}
        id={"close"}
        onClick={(e) => props.onNodeClick(club)}
      >
        <FontAwesomeIcon icon={faTimesCircle} />
      </button>
      <h3 style={{ backgroundColor: color }} className={"clubName"}>
        <a rel={"noopener noreferrer"} target={"_blank"} href={link}>
          {club.id}
        </a>
      </h3>
      {img}
      <div className={"center"}>
        {club.region}
        {club.region === club.country ? "" : " - " + club.country}
      </div>
    </div>
  );
};

const Table = (header, data) => {
  return (
    <tr key={header + "row"}>
      <td key={header + "cell"}>{header}</td>
      {data.map((e, i) => {
        return <td key={header + "-" + i}>{e}</td>;
      })}
    </tr>
  );
};

const ClubTable = (props) => {
  const rows = props.clubs.map((club) => {
    return [
      club.number_of_dates,
      club.number_of_unique_artists,
      club.total_number_of_artists,
      club.followers,
      (club.attending / club.number_of_dates).toFixed(1),
      (
        club.total_number_of_artists / club.number_of_unique_artists || 0
      ).toFixed(1),
      (club.total_number_of_artists / club.number_of_dates).toFixed(2),
    ];
  });

  const headers = [
    "Number of events",
    "Unique artists",
    "Total artists booked",
    "Followers",
    "Average event attendance",
    "Average bookings per artist",
    "Average artists per date",
  ];

  let tableRows = headers.map((e, i) => {
    return (
      <tr key={i}>
        <td key={e}>{e}</td>
        {rows.map((e, j) => (
          <td key={i + "-" + j}>{e[i]}</td>
        ))}
      </tr>
    );
  });
  //.concat(<Table title="Most Booked Artists" rows={mostCommonArtists()) /> )
  //.concat(<Table title="Most Similar Clubs", rowx={mostSimilarClubs()));

  const header =
    rows.length !== 2 ? null : (
      <thead>
        <tr>
          <th key={"empty"} />
          {props.clubs.map((e) => (
            <th key={e.id}>{e.id}</th>
          ))}
        </tr>
      </thead>
    );
  return (
    <table>
      {header}
      <tbody>{tableRows}</tbody>
    </table>
  );
};

const ClubGroup = (props) => {
  const club = props.clubs[0];
  const groupClubs = props.data.nodes.filter((e) => {
    return club.group === e.group && e.id !== club.id;
  });
  if (groupClubs.length < 2) {
    return <h3 className={"cluster"}>No other clubs in this cluster</h3>;
  }

  const stats = groupClubs.reduce((acc, e) => {
    acc[e.region] = acc[e.region] + 1 || 1;
    return acc;
  }, {});

  const color = fillColor(club.group, props.categories);
  return (
    <div className={"cluster"} style={{ width: "50%" }}>
      <h3>Other clubs in this cluster</h3>
      <BarChart
        data={Object.entries(stats)}
        width={312}
        height={210}
        color={color}
      />
      <ul>
        {groupClubs.map((club) => (
          <li key={club.id}>
            <button
              className={"clubButton"}
              onClick={(e) => {
                console.log("Here");
              }}
            >
              {club.id}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Similarities = (props) => {
  const artists = props.clubs.reduce((acc, e) => {
    acc.push(Object.keys(e.artists));
    return acc;
  }, []);
  const union = artists[0].filter((e) => artists[1].includes(e));

  if (union.length === 0) {
    return (
      <div className={"similarities"}>
        <h4>No overlap in lineups - no common artists</h4>
      </div>
    );
  }

  const ids = props.clubs.map((e) => e.id);
  const overlap = (
    props.data.links.find((e) => {
      return ids.includes(e.source) && ids.includes(e.target);
    }).weight * 100
  ).toFixed(2);

  return (
    <div className={"similarities"}>
      <h4>
        {overlap}% overlap in lineups - {union.length} common artists:
      </h4>
      <ul>
        {union.map((artistName) => (
          <li key={artistName}>
            {artistLink(artistName, props.data.artist_names_to_ids)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default (props) => {
  const { clubs } = props;
  return (
    <div className={"clubDetail visible"}>
      <div className={"clubInfo" + clubs.length}>
        {clubs.map((club) => (
          <Club {...props} club={club} />
        ))}
        <ClubTable {...props} />
      </div>
      {clubs.length === 1 && <ClubGroup {...props}></ClubGroup>}
      {clubs.length === 2 && <Similarities {...props}></Similarities>}
    </div>
  );
};
