/*jslint white: true, browser: true, devel: true, undef: true,
nomen: true, bitwise: true, plusplus: true,
regexp: true, eqeq: true, newcap: true, forin: false */
/*global window,escape,jQuery,$j,rison,utility,
festival,feed,duelchamp,town,
$u,chrome,CAAP_SCOPE_RUN,self,caap,config,con,gm,hiddenVar,
schedule,gifting,state,army, general,session,monster,guild_monster */
/*jslint maxlen: 256 */

/////////////////////////////////////////////////////////////////////
//                          BATTLING PLAYERS
/////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    caap.duelchampUserId = function(record) {
        try {
            var duelchampButton = $j(),
                form = $j(),
                inp = $j();

            duelchampButton = caap.checkForImage(duelchamp.battles[config.getItem('DuelchampType', 'Challenge')]);
            if ($u.hasContent(duelchampButton)) {
                form = duelchampButton.parent().parent();
                if ($u.hasContent(form)) {
                    inp = $j("input[name='target_id']", form);
                    if ($u.hasContent(inp)) {
                        inp.attr("value", record.userId);
                        con.log(1, 'Attacking', record);
                        duelchamp.click(duelchampButton);
                        duelchampButton = null;
                        form = null;
                        inp = null;
                        return true;
                    }

                    con.warn("target_id not found in duelchampForm");
                } else {
                    con.warn("form not found in duelchampButton");
                }
            } else {
                con.warn("duelchampButton not found");
            }

            duelchampButton = null;
            form = null;
            inp = null;
            return false;
        } catch (err) {
            con.error("ERROR in duelchampUserId: " + err);
            return false;
        }
    };

    caap.duelchampBattle = function() {
        try {
            var whenduelchamp = '',
                targetRecord = {},
                targetId = 0,
                duelchamptype = '',
                useGeneral = '',
                chainImg = '',
                tempDiv = $j(),
                button = $j(),
                duelchampChainId = 0,
                it = 0,
                len = 0;

            whenduelchamp = config.getItem('WhenDuelchamp', 'Never');
            if (whenduelchamp === 'Never') {
                caap.setDivContent('duelchamp_mess', 'Duelchamp off');
                button = null;
                tempDiv = null;
                return false;
            }

            if (!schedule.check("duelchamp_delay")) {
                con.log(4, 'Duelchamp delay attack', $u.setContent(caap.displayTime('duelchamp_delay'), "Unknown"));
                caap.setDivContent('duelchamp_mess', 'Duelchamp delay (' + $u.setContent(caap.displayTime('duelchamp_delay'), "Unknown") + ')');
                button = null;
                tempDiv = null;
                return false;
            }

            if (caap.stats.level >= 8 && caap.stats.health.num >= 10 && caap.stats.stamina < 0) {
                schedule.setItem("duelchamp_delay_stats", 0);
            }

            if (!schedule.check("duelchamp_delay_stats")) {
                con.log(4, 'Duelchamp delay stats', $u.setContent(caap.displayTime('duelchamp_delay_stats'), "Unknown"));
                caap.setDivContent('duelchamp_mess', 'Duelchamp stats (' + $u.setContent(caap.displayTime('duelchamp_delay_stats'), "Unknown") + ')');
                button = null;
                tempDiv = null;
                return false;
            }

            if (caap.stats.level < 8) {
                schedule.setItem("duelchamp_token", 86400, 300);
                schedule.setItem("duelchamp_delay_stats", 86400, 300);
                if (caap.duelchampWarnLevel) {
                    con.log(1, "duelchamp: Unlock at level 8");
                    caap.duelchampWarnLevel = false;
                }

                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return false;
            }

            duelchamptype = config.getItem('DuelchampType', 'Challenge');
            if (!caap.checkStamina('Duelchamp', 1)) {
                con.log(1, 'Not enough stamina for ', duelchamptype);
                schedule.setItem("duelchamp_delay_stats", (caap.stats.stamina.ticker[0] * 60) + caap.stats.stamina.ticker[1], 300);
                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return false;
            }

            if (caap.checkKeep()) {
                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return true;
            }

            switch (duelchamptype) {
            case 'Duelchamp':
                useGeneral = 'DuelGeneral';
                chainImg = duelchamp.battles.DuelchampChain;
                if (general.LevelUpCheck(useGeneral)) {
                    useGeneral = 'LevelUpGeneral';
                    con.log(1, 'Using level up general');
                }

                break;
            default:
                con.warn('Unknown duelchamp type ', duelchamptype);
                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return false;
            }

            con.log(1, duelchamptype, useGeneral);
            if (general.Select(useGeneral)) {
                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return true;
            }

            if (caap.navigateTo('duelchamp_duel', 'conqduel_on.jpg')) {
                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return true;
            }

            con.log(1, 'Chain target');
            // Check if we should chain attack
            tempDiv = $j("#app_body div[style*='war_fort_battlevictory.jpg']");
            con.log(1, 'Chain target victory check', tempDiv);
            if ($u.hasContent(tempDiv)) {
                con.log(1, 'Chain target victory!');
                button = $j("#app_body input[src*='" + chainImg + "']");
                con.log(1, 'Chain target button check', button);
                duelchampChainId = state.getItem("DuelchampChainId", 0);
                con.log(1, 'Chain target duelchampChainId', duelchampChainId);
                if ($u.hasContent(button) && $u.isNumber(duelchampChainId) && duelchampChainId > 0) {
                    caap.setDivContent('duelchamp_mess', 'Chain Attack In Progress');
                    con.log(1, 'Chaining Target', duelchampChainId);
                    duelchamp.click(button);
                    state.setItem("DuelchampChainId", 0);
                    button = null;
                    tempDiv = null;
                    return true;
                }

                state.setItem("DuelchampChainId", 0);
            }

            con.log(1, 'Get on page target');
            targetId = $u.hasContent(duelchamp.targets) ? duelchamp.targets[0] : 0;
            con.log(1, 'targetId', targetId);
            if (!$u.hasContent(targetId) || targetId < 1) {
                con.log(1, 'No valid duelchamp targetId', targetId);
                schedule.setItem('duelchamp_delay', Math.floor(Math.random() * 240) + 60);
                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return false;
            }

            for (it = 0, len = duelchamp.targetsOnPage.length; it < len; it += 1) {
                if (duelchamp.targetsOnPage[it].userId === targetId) {
                    targetRecord = duelchamp.targetsOnPage[it];
                }
            }

            if (!$u.hasContent(targetRecord)) {
                con.log(1, 'No valid duelchamp target',targetId, targetRecord, duelchamp.targets);
                state.setItem("DuelchampChainId", 0);
                button = null;
                tempDiv = null;
                return false;
            }

            con.log(1, 'duelchamp Target', targetRecord);
            if (caap.duelchampUserId(targetRecord)) {
                caap.setDivContent('duelchamp_mess', 'Duelchamp Target: ' + targetRecord.userId);
                button = null;
                tempDiv = null;
                return true;
            }

            con.warn('Doing duelchamp target list, but no target');
            state.setItem("DuelchampChainId", 0);
            button = null;
            tempDiv = null;
            return false;
        } catch (err) {
            con.error("ERROR in duelchamp: " + err);
            return false;
        }
    };

}());
