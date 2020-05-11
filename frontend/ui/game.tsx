import * as React from 'react';
import { Settings, SettingsButton, SettingsPanel } from './settings';
import Timer from './timer';

async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

const defaultFavicon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAA8SURBVHgB7dHBDQAgCAPA1oVkBWdzPR84kW4AD0LCg36bXJqUcLL2eVY/EEwDFQBeEfPnqUpkLmigAvABK38Grs5TfaMAAAAASUVORK5CYII=';
const blueTurnFavicon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAmSURBVHgB7cxBAQAABATBo5ls6ulEiPt47ASYqJ6VIWUiICD4Ehyi7wKv/xtOewAAAABJRU5ErkJggg==';
const redTurnFavicon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAmSURBVHgB7cwxAQAACMOwgaL5d4EiELGHoxGQGnsVaIUICAi+BAci2gJQFUhklQAAAABJRU5ErkJggg==';

interface GameProps {
  gameID: string;
}

interface GameState {
  game: any;
  mounted: boolean;
  mode: string;
  codemaster: boolean;
  settings: {
    darkMode: boolean;
    fullscreen: boolean;
    colorBlind: boolean;
    spymasterMayGuess: boolean;
  };
}

export class Game extends React.Component<GameProps, GameState> {
  constructor(props) {
    super(props);
    this.state = {
      game: null,
      mounted: true,
      settings: Settings.load(),
      mode: 'game',
      codemaster: false,
    };
  }

  public extraClasses() {
    var classes = '';
    if (this.state.settings.colorBlind) {
      classes += ' color-blind';
    }
    if (this.state.settings.darkMode) {
      classes += ' dark-mode';
    }
    if (this.state.settings.fullscreen) {
      classes += ' full-screen';
    }
    return classes;
  }

  public handleKeyDown(e) {
    if (e.keyCode == 27) {
      this.setState({ mode: 'game' });
    }
  }

  public componentDidMount(prevProps, prevState) {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.setDarkMode(prevProps, prevState);
    this.setTurnIndicatorFavicon(prevProps, prevState);
    this.refresh();
  }

  public componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.getElementById('favicon').setAttribute('href', defaultFavicon);
    this.setState({ mounted: false });
  }

  public componentDidUpdate(prevProps, prevState) {
    this.setDarkMode(prevProps, prevState);
    this.setTurnIndicatorFavicon(prevProps, prevState);
  }

  private setDarkMode(prevProps, prevState) {
    if (!prevState?.settings.darkMode && this.state.settings.darkMode) {
      document.body.classList.add('dark-mode');
    }
    if (prevState?.settings.darkMode && !this.state.settings.darkMode) {
      document.body.classList.remove('dark-mode');
    }
  }

  private setTurnIndicatorFavicon(prevProps, prevState) {
    if (
      prevState?.game?.winning_team !== this.state.game?.winning_team ||
      prevState?.game?.round !== this.state.game?.round ||
      prevState?.game?.state_id !== this.state.game?.state_id
    ) {
      if (this.state.game?.winning_team) {
        document.getElementById('favicon').setAttribute('href', defaultFavicon);
      } else {
        document
          .getElementById('favicon')
          .setAttribute(
            'href',
            this.currentTeam() === 'blue' ? blueTurnFavicon : redTurnFavicon
          );
      }
    }
  }

  public refresh() {
    if (!this.state.mounted) {
      return;
    }

    let state_id = '';
    if (this.state.game && this.state.game.state_id) {
      state_id = this.state.game.state_id;
    }

    postData('/game-state', { game_id: this.props.gameID, state_id: state_id })
      .then((data) => {
        if (this.state.game && data.created_at != this.state.game.created_at) {
          this.setState({ codemaster: false });
        }
        this.setState({ game: data });
      })
      .then(() => {
        setTimeout(() => {
          this.refresh();
        }, 2000);
      });
  }

  public toggleRole(e, role) {
    e.preventDefault();
    this.setState({ codemaster: role == 'codemaster' });
  }

  public guess(e, idx) {
    e.preventDefault();
    if (this.state.codemaster && !this.state.settings.spymasterMayGuess) {
      return; // ignore if player is the codemaster
    }
    if (this.state.game.revealed[idx]) {
      return; // ignore if already revealed
    }
    if (this.state.game.winning_team) {
      return; // ignore if game is over
    }
    postData('/guess', {
      game_id: this.state.game.id,
      index: idx,
    }).then((data) => {
      this.setState({ game: data });
    });
  }

  public currentTeam() {
    if (this.state.game.round % 2 == 0) {
      return this.state.game.starting_team;
    }
    return this.state.game.starting_team == 'red' ? 'blue' : 'red';
  }

  public remaining(color) {
    var count = 0;
    for (var i = 0; i < this.state.game.revealed.length; i++) {
      if (this.state.game.revealed[i]) {
        continue;
      }
      if (this.state.game.layout[i] == color) {
        count++;
      }
    }
    return count;
  }

  public endTurn() {
    postData('/end-turn', {
      game_id: this.state.game.id,
      current_round: this.state.game.round,
    }).then((data) => {
      this.setState({ game: data });
    });
  }

  public nextGame(e) {
    e.preventDefault();
    // Ask for confirmation when current game hasn't finished
    let allowNextGame =
      this.state.game.winning_team ||
      confirm('Do you really want to start a new game?');
    if (!allowNextGame) {
      return;
    }
    postData('/next-game', {
      game_id: this.state.game.id,
      word_set: this.state.game.word_set,
      create_new: true,
      timer_duration_ms: this.state.game.timer_duration_ms,
    }).then((data) => {
      this.setState({ game: data, codemaster: false });
    });
  }

  public toggleSettingsView(e) {
    if (e != null) {
      e.preventDefault();
    }
    if (this.state.mode == 'settings') {
      this.setState({ mode: 'game' });
    } else {
      this.setState({ mode: 'settings' });
    }
  }

  public toggleSetting(e, setting) {
    if (e != null) {
      e.preventDefault();
    }
    const vals = { ...this.state.settings };
    vals[setting] = !vals[setting];
    this.setState({ settings: vals });
    Settings.save(vals);
  }

  render() {
    if (!this.state.game) {
      return <p className="loading">Loading&hellip;</p>;
    }
    if (this.state.mode == 'settings') {
      return (
        <SettingsPanel
          toggleView={(e) => this.toggleSettingsView(e)}
          toggleAction={(e, setting) => this.toggleSetting(e, setting)}
          values={this.state.settings}
        />
      );
    }

    let status, statusClass;
    if (this.state.game.winning_team) {
      statusClass = this.state.game.winning_team + ' win';
      status = this.state.game.winning_team + ' wins!';
    } else {
      statusClass = this.currentTeam() + '-turn';
      status = this.currentTeam() + "'s turn";
    }

    let endTurnButton;
    if (!this.state.game.winning_team && !this.state.codemaster) {
      endTurnButton = (
        <div id="end-turn-cont">
          <button onClick={() => this.endTurn()} id="end-turn-btn">
            End {this.currentTeam()}&#39;s turn
          </button>
        </div>
      );
    }

    let otherTeam = 'blue';
    if (this.state.game.starting_team == 'blue') {
      otherTeam = 'red';
    }

    let shareLink = null;
    if (!this.state.settings.fullscreen) {
      shareLink = (
        <div id="share">
          Send this link to friends:&nbsp;
          <a className="url" href={window.location.href}>
            {window.location.href}
          </a>
        </div>
      );
    }

    const timer = !!this.state.game.timer_duration_ms && (
      <div id="timer">
        <Timer
          roundStartedAt={this.state.game.round_started_at}
          timerDurationMs={this.state.game.timer_duration_ms}
          handleExpiration={() => {
            this.state.game.enforce_timer && this.endTurn();
          }}
          freezeTimer={!!this.state.game.winning_team}
        />
      </div>
    );

    return (
      <div
        id="game-view"
        className={
          (this.state.codemaster ? 'codemaster' : 'player') +
          this.extraClasses()
        }
      >
        <div id="infoContent">
          {shareLink}
          {timer}
        </div>
        <div id="status-line" className={statusClass}>
          <div id="remaining">
            <span className={this.state.game.starting_team + '-remaining'}>
              {this.remaining(this.state.game.starting_team)}
            </span>
            &nbsp;&ndash;&nbsp;
            <span className={otherTeam + '-remaining'}>
              {this.remaining(otherTeam)}
            </span>
          </div>
          <div id="status" className="status-text">
            {status}
          </div>
          {endTurnButton}
        </div>
        <div className={'board ' + statusClass}>
          {this.state.game.words.map((w: string, idx: number) => (
            <div
              key={idx}
              className={
                'cell ' +
                this.state.game.layout[idx] +
                ' ' +
                (this.state.codemaster && !this.state.settings.spymasterMayGuess
                  ? 'disabled '
                  : '') +
                (this.state.game.revealed[idx] ? 'revealed' : 'hidden-word')
              }
              onClick={(e) => this.guess(e, idx)}
            >
              <span className="word">{w}</span>
            </div>
          ))}
        </div>
        <form
          id="mode-toggle"
          className={
            this.state.codemaster ? 'codemaster-selected' : 'player-selected'
          }
        >
          <SettingsButton
            onClick={(e) => {
              this.toggleSettingsView(e);
            }}
          />
          <button
            onClick={(e) => this.toggleRole(e, 'player')}
            className="player"
          >
            Player
          </button>
          <button
            onClick={(e) => this.toggleRole(e, 'codemaster')}
            className="codemaster"
          >
            Spymaster
          </button>
          <button onClick={(e) => this.nextGame(e)} id="next-game-btn">
            Next game
          </button>
        </form>
        <div id="coffee">
          <a href="https://www.buymeacoffee.com/jbowens" target="_blank">
            Buy the developer a coffee.
          </a>
        </div>
      </div>
    );
  }
}
