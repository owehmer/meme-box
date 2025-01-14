import {Injectable, ProviderScope, ProviderType} from "@tsed/di";
import {TwitchConnector} from "./twitch.connector";
import {Inject} from "@tsed/common";
import {PERSISTENCE_DI} from "../contracts";
import {Persistence} from "../../persistence";
import {Dictionary, TwitchTriggerCommand} from "@memebox/contracts";
import {TwitchLogger} from "./twitch.logger";
import {MemeboxWebsocket} from "../websockets/memebox.websocket";
import {isAllowedToTrigger} from "./twitch.utils";
import {getCommandsOfTwitchEvent, getLevelOfTags} from "./twitch.functions";
import {AllTwitchEvents} from "./twitch.connector.types";
import {ExampleTwitchCommandsSubject} from "../../shared";

@Injectable({
  type: ProviderType.SERVICE,
  scope: ProviderScope.SINGLETON
})
export class TwitchHandler {
  private cooldownDictionary: Dictionary<number> = {}; // last timestamp of twitch command

  constructor(
    private _twitchConnector: TwitchConnector,
    private _twitchLogger: TwitchLogger,
    @Inject(PERSISTENCE_DI) private _persistence: Persistence,
    private _memeboxWebsocket: MemeboxWebsocket
  ) {

    _twitchConnector
      .twitchEvents$()
      .subscribe(twitchEvent => {
        const foundCommandsIterator = getCommandsOfTwitchEvent(
          this._twitchConnector.twitchSettings,
          twitchEvent as AllTwitchEvents
        );

        for (const command of foundCommandsIterator) {
          // todo add the correct twitchevent-types!
          this.handle({
            // event: TwitchEventTypes.message,
            command,
            tags: {}
          });
        }
      })

    // TODO REFACTOR this Subject
    ExampleTwitchCommandsSubject.subscribe(value => {
      this.handle(value);
    });
  }

  handle(trigger: TwitchTriggerCommand) {
    if (trigger.command) {
      this._twitchLogger.log(`Trigger "${trigger.command.name}" Type - ${trigger.command.event}`);

      this._twitchLogger.log({
        message: 'Trigger Tags',
        tags: trigger.tags
      });

      const foundLevels = getLevelOfTags(trigger.tags);

      const isBroadcaster = foundLevels.includes('broadcaster');
      const allowedByRole = isAllowedToTrigger(trigger, foundLevels);


      const cooldownEntry = this.cooldownDictionary[trigger.command.id];
      const allowedByCooldown = cooldownEntry && trigger.command.cooldown
        ? (Date.now() - cooldownEntry) > trigger.command.cooldown
        : true;

      const allowedToTrigger = isBroadcaster || (allowedByRole && allowedByCooldown);


      if (allowedToTrigger) {
        this.cooldownDictionary[trigger.command.id] = Date.now();

        this._memeboxWebsocket.triggerMediaClipById({
          id: trigger.command.clipId
        });
      }
    }
  }
}
