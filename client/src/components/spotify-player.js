import React from "react";
import { useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { refreshSpotifyToken } from "../redux/actions/spotifyActions";
import { usePrevious } from "../utils/hooks";

const SpotifyPlayer = ({
  forwardRef,
  playerName,
  track,
  isPlaying,
  onReady,
  onNotReady,
  onEnd,
  volume
}) => {
  const dispatch = useDispatch();
  const player = useRef(null);

  useSpotifyWebPlaybackSdkScript();

  useEffect(() => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      function fetchToken() {
        return dispatch(refreshSpotifyToken());
      }

      if (!player.current) {
        player.current = new SpotifyWebPlaybackSdk(
          playerName,
          fetchToken,
          volume
        );
        player.current.initPlayer();
        player.current.onTrackEnd = onEnd;
        player.current.onReady = onReady;
        player.current.onNotReady = onNotReady;

        if (forwardRef) {
          forwardRef.current = player.current;
        }
      }
    }; //eslint-disable-next-line
  }, []);

  const prevTrack = usePrevious(track);

  useEffect(() => {
    const spotifyPlayer = player.current;

    if (!spotifyPlayer) return;

    const trackHasChanged = prevTrack !== track;
    const trackHasLoaded = spotifyPlayer.isLoaded;

    if (isPlaying) {
      if (trackHasChanged) {
        // Is playing and track changed, load new song
        spotifyPlayer.load(track.id);
      } else {
        if (trackHasLoaded) {
          // Is playing but track already loaded, resume playing
          spotifyPlayer.play();
        } else {
          // Is playing but hasn't loaded, load the new track
          spotifyPlayer.load(track.id);
        }
      }
    } else {
      if (trackHasChanged) {
        // Isn't playing but track has changed, set isLoaded to false
        spotifyPlayer.isLoaded = false;
        spotifyPlayer.pause();
      } else {
        // Track hasnt changed, just pause
        spotifyPlayer.pause();
      }
      // Omit prevTrack, it can only change if track changes
    } //eslint-disable-next-line
  }, [track, isPlaying]);

  useEffect(() => {
    if (player.current) {
      player.current.setVolume(volume);
    }
  }, [volume]);

  return <></>;
};

function useSpotifyWebPlaybackSdkScript() {
  useEffect(() => {
    if (!window.Spotify) {
      addSpotifySdkToDom();
    }
  }, []);
}

class SpotifyWebPlaybackSdk {
  constructor(playerName, fetchToken, volume) {
    this.playerName = playerName;
    this.fetchToken = fetchToken;
    this.volume = volume;
    this.accessToken = null;

    this.deviceId = null;
    this.timer = null;

    this.fetchAndSetToken = this.fetchAndSetToken.bind(this);
  }

  initPlayer() {
    this.player = new window.Spotify.Player({
      name: this.playerName,
      getOAuthToken: this.fetchAndSetToken,
      volume: this.volume || 1
    });

    this.addListeners();

    return this.player.connect();
  }

  fetchAndSetToken(cb) {
    return this.fetchToken()
      .then(token => {
        this.setAccessToken(token);
        if (cb) cb(token);
      })
      .catch(e => console.error(`Error refreshing spotify player ${e}`));
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  load(trackId, tries = 3) {
    console.log("loading");
    this.isLoaded = false;

    if (!tries) {
      return console.error(`Couldn't load track ${trackId}`);
    }

    if (this.deviceId) {
      return this.loadTrackToPlayer(trackId).then(res => {
        if (res.status === 401) {
          // Expired token
          return this.fetchAndSetToken().then(() =>
            this.load(trackId, --tries)
          );
        } else if (res.status === 404) {
          console.log("error 404 on track PUT, trying to reinitialize");
          return this.initPlayer().then(() => {
            console.log("Spoitfy player reinitialized");
            return this.load(trackId, --tries);
          });
        }

        this.isLoaded = true;
        this.progressMs = 0;
        this.trackSeekPosition();
      });
    } else {
      setTimeout(() => this.load(trackId, --tries), 500);
    }
  }

  loadTrackToPlayer(trackId) {
    return fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`]
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );
  }

  play(tries = 3) {
    if (!this.isLoaded) return;

    if (!tries) {
      return console.error(`Error playing spotify track`);
    }

    if (this.deviceId) {
      this.player.resume();
      this.trackSeekPosition();
    } else {
      setTimeout(() => this.play(--tries), 300);
    }
  }

  pause(tries = 3) {
    if (!this.isLoaded) return;

    if (!tries) {
      return console.error(`Error pausing spotify track`);
    }

    if (this.deviceId) {
      this.player.pause();
      this.stopTrackingSeekPosition();
    } else {
      setTimeout(() => this.pause(--tries), 300);
    }
  }

  seek(position) {
    if (!this.isLoaded) return;

    if (!position && position !== 0) {
      return this.progressMs;
    }

    if (this.deviceId) {
      this.player.seek(position);
    } else {
      throw new Error("SpotifyPlayer isn't enabled");
    }
  }

  setVolume(volume) {
    this.volume = volume;

    this.player.setVolume(volume);
  }

  getPlaybackState() {
    return fetch(`https://api.spotify.com/v1/me/player`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      method: "GET"
    }).then(d => {
      if (d.status === 204) {
        return new Promise(resolve => {
          return resolve(undefined);
        });
      }
      return d.json();
    });
  }

  trackSeekPosition() {
    clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.progressMs += 500;
    }, 500);
  }

  stopTrackingSeekPosition() {
    clearInterval(this.timer);
  }

  addListeners() {
    this.player.addListener("initialization_error", e => {
      console.error("initialization_error", e.message);
    });
    this.player.addListener("authentication_error", e => {
      console.error("authentication_error", e.message);
    });
    this.player.addListener("account_error", e => {
      console.error("account_error", e.message);
    });
    this.player.addListener("playback_error", e => {
      console.error("playback_error", e);
    });

    // Playback status updates
    this.player.removeListener("player_state_changed");
    this.player.addListener("player_state_changed", state =>
      this.handleStateChange(state)
    );

    this.player.addListener("ready", data => {
      let d = new Date();
      console.log(
        `Ready with Device ID: ${
          data.device_id
        } @${d.getHours()}:${d.getMinutes()}`
      );
      this.deviceId = data.device_id;

      if (this.onReady) this.onReady();
    });

    this.player.addListener("not_ready", data => {
      console.log("Device ID has gone offline", data.device_id);
      this.deviceId = null;

      if (this.onNotReady) this.onNotReady();
    });
  }

  handleStateChange(state) {
    if (
      this.state &&
      state &&
      state.track_window.previous_tracks.find(
        x => x.id === state.track_window.current_track.id
      ) &&
      !this.state.paused &&
      state.paused
    ) {
      // Track ended
      this.stopTrackingSeekPosition();

      if (this.onTrackEnd) {
        this.onTrackEnd();
      }
    }

    this.state = state;
    this.progressMs = state.position;
  }
}

function addSpotifySdkToDom() {
  const spotifyScript = document.createElement("script");
  spotifyScript.id = "spotify-script";
  spotifyScript.src = "https://sdk.scdn.co/spotify-player.js";
  document.head.appendChild(spotifyScript);
}

SpotifyPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired
};

export default SpotifyPlayer;
