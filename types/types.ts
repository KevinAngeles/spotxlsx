import { ObjectId, Db, InsertOneResult } from 'mongodb';

export type TPlaylists = {
  href: string;
  items: TPlaylist[];
  limit: number | null;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export type TPlaylist = {
  collaborative: boolean;
  description: string | null;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: {
    height: number | null;
    url: string;
    width: number | null; 
  }[];
  name: string;
  owner: {
    display_name: string | null;
    external_urls: {
      spotify: string;
    };
    followers?: {
      href: string;
      total: number;
    };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  primary_color: string | null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  },
  type: string;
  uri: string;
}

export type TErrorWithMessage = {
  message: string;
  status?: number;
}

export type TJsonError = {
  error: TErrorWithMessage;
}

export type TTrack = {
  added_at: string;
  added_by: {
    external_urls: {
      spotify: string;
    },
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  is_local: boolean,
  primary_color: string | null,
  track: {
    album: {
      album_type: string | null,
      artists: {
        external_urls: {
          spotify?: string;
        };
        href: string | null;
        id: string | null;
        name: string;
        type: string;
        uri: string | null;
      }[];
      available_markets: string[];
      external_urls: {
        spotify?: string;
      };
      href: string | null;
      id: string | null;
      images: {
        height: number;
        url: string;
        width: number;
      }[];
      name: string;
      release_date: string | null;
      release_date_precision: string | null,
      total_tracks?: number,
      type: string;
      uri: string | null;
    };
    artists: {
      external_urls: {
        spotify?: string;
      };
      href: string | null;
      id: string | null;
      name: string;
      type: string;
      uri: string | null;
    }[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    episode?: boolean;
    explicit: boolean;
    external_ids: {
      isrc?: string
    };
    external_urls: {
      spotify?: string
    };
    href: string | null;
    id: string | null;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url: string | null;
    track?: boolean;
    track_number: number;
    type: string;
    uri: string;
  };
  video_thumbnail: {
    url: string | null;
  };
}

export type TPlaylistTracks = {
  href: string;
  items: TTrack[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export type TUser = {
  _id?: ObjectId;
  spotifyId: string;
  accessToken: string;
  refreshToken: string;
  expiration_date: Date;
}
