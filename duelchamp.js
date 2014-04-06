/*jslint white: true, browser: true, devel: true, undef: true,
nomen: true, bitwise: true, plusplus: true,
regexp: true, eqeq: true, newcap: true, forin: false */
/*global window,escape,jQuery,$j,rison,utility,gm,hiddenVar,
$u,chrome,CAAP_SCOPE_RUN,self,caap,config,con,battle,conquest,duelchamp,
schedule,gifting,state,army, general,session,monster,guild_monster */
/*jslint maxlen: 256 */

////////////////////////////////////////////////////////////////////
//                          DUEL CHAMPION OBJECT
// this is the main object for dealing with Duel Champion
/////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    duelchamp.records = [];

    duelchamp.record = function() {
        this.data = {
            'userId': 0,
            'nameStr': '',
            'duelchampNum': 0,
            'levelNum': 0,
            'duelchampwinsNum': 0,
            'duelchamplossesNum': 0,
            'dcbp': 0,
            'statswinsNum': 0,
            'statslossesNum': 0,
            'chainCount': 0,
            'duelchampLostTime': 0,
            'deadTime': 0,
            'chainTime': 0,
            'ignoreTime': 0,
            'aliveTime': 0,
            'attackTime': 0,
            'selectTime': 0,
            'unknownTime': 0,
            'score': 0,
            'newRecord': true
        };
    };

    duelchamp.duelchampRankTier = function(points) {
        var tier = 0;

        if (points >= 1000000) {
            tier = 18;
        } else if (points >= 800000) {
            tier = 17;
        } else if (points >= 650000) {
            tier = 16;
        } else if (points >= 500000) {
            tier = 15;
        } else if (points >= 350000) {
            tier = 14;
        } else if (points >= 300000) {
            tier = 13;
        } else if (points >= 250000) {
            tier = 12;
        } else if (points >= 200000) {
            tier = 11;
        } else if (points >= 150000) {
            tier = 10;
        } else if (points >= 100000) {
            tier = 9;
        } else if (points >= 75000) {
            tier = 8;
        } else if (points >= 40000) {
            tier = 7;
        } else if (points >= 20000) {
            tier = 6;
        } else if (points >= 12000) {
            tier = 5;
        } else if (points >= 6000) {
            tier = 4;
        } else if (points >= 3000) {
            tier = 3;
        } else if (points >= 1500) {
            tier = 2;
        } else if (points >= 500) {
            tier = 1;
        }

        return tier;
    };

    duelchamp.duelchampRankTable = {
        1: Initiate,
	2: Vandal,
	3: Savage,
	4: Brigand,
	5: Enforcer,
	6: Fighter,
	7: Protector,
	8: Defender,
	9: Guardian,
	10: Slaughter,
	11: Killer,
	12: Slayer,
	13: Avenger,
	14: Rechoner,
	15: Eradicator,
	16: Champion,
	17: Archon,
	18: Master,
    };

    duelchamp.hbest = 2;

    duelchamp.load = function() {
        try {
            duelchamp.records = gm.getItem('duelchamp.records', 'default');
            if (duelchamp.records === 'default' || !$j.isArray(duelchamp.records)) {
                duelchamp.records = gm.setItem('duelchamp.records', []);
            }

            duelchamp.hbest = duelchamp.hbest === false ? JSON.hbest(duelchamp.records) : duelchamp.hbest;
            con.log(2, "duelchamp.load Hbest", duelchamp.hbest);
            session.setItem("DuelchampDashUpdate", true);
            con.log(1, "duelchamp.load", duelchamp.records);
            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.load: " + err);
            return false;
        }
    };

    duelchamp.save = function(src) {
        try {
            var compress = false;

            if (caap.domain.which === 3) {
                caap.messaging.setItem('duelchamp.records', duelchamp.records);
            } else {
                gm.setItem('duelchamp.records', duelchamp.records, duelchamp.hbest, compress);
                con.log(2, "duelchamp.save", duelchamp.records);
                if (caap.domain.which === 0 && caap.messaging.connected.hasIndexOf("caapif") && src !== "caapif") {
                    caap.messaging.setItem('duelchamp.records', duelchamp.records);
                }
            }

            if (caap.domain.which !== 0) {
                session.setItem("DuelchampDashUpdate", true);
            }

            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.save: " + err);
            return false;
        }
    };

    duelchamp.clear = function() {
        try {
            duelchamp.records = [];
            duelchamp.save();
            session.setItem("DuelchampDashUpdate", true);
            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.clear: " + err);
            return false;
        }
    };

    duelchamp.getItem = function(userId) {
        try {
            var it = 0,
                len = 0,
                success = false,
                newRecord = null;

            if (userId === '' || $u.isNaN(userId) || userId < 1) {
                con.warn("userId", userId);
                throw "Invalid identifying userId!";
            }

            for (it = 0, len = duelchamp.records.length; it < len; it += 1) {
                if (duelchamp.records[it].userId === userId) {
                    success = true;
                    break;
                }
            }

            if (success) {
                con.log(2, "Got duel champion record", userId, duelchamp.records[it]);
                duelchamp.records[it].newRecord = false;
                return duelchamp.records[it];
            }

            newRecord = new duelchamp.record();
            newRecord.data.userId = userId;
            con.log(2, "New duel champion record", userId, newRecord.data);
            return newRecord.data;
        } catch (err) {
            con.error("ERROR in duelchamp.getItem: " + err);
            return false;
        }
    };

    duelchamp.setItem = function(record) {
        try {
            if (!record || !$j.isPlainObject(record)) {
                throw "Not passed a record";
            }

            if (record.userId === '' || $u.isNaN(record.userId) || record.userId < 1) {
                con.warn("userId", record.userId);
                throw "Invalid identifying userId!";
            }

            var it = 0,
                len = 0,
                success = false;

            for (it = 0, len = duelchamp.records.length; it < len; it += 1) {
                if (duelchamp.records[it].userId === record.userId) {
                    success = true;
                    break;
                }
            }

            record.newRecord = false;
            if (success) {
                duelchamp.records[it] = record;
                con.log(1, "Updated duel champion record", record, duelchamp.records);
            } else {
                duelchamp.records.push(record);
                con.log(1, "Added duel champion record", record, duelchamp.records);
            }

            duelchamp.save();
            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.setItem: " + err, record);
            return false;
        }
    };

    duelchamp.deleteItem = function(userId) {
        try {
            var it = 0,
                len = 0,
                success = false;

            if (userId === '' || $u.isNaN(userId) || userId < 1) {
                con.warn("userId", userId);
                throw "Invalid identifying userId!";
            }

            for (it = 0, len = duelchamp.records.length; it < len; it += 1) {
                if (duelchamp.records[it].userId === userId) {
                    success = true;
                    break;
                }
            }

            if (success) {
                duelchamp.records.splice(it, 1);
                duelchamp.save();
                con.log(1, "Deleted duel champion record", userId, duelchamp.records);
                return true;
            }

            con.warn("Unable to delete duel champion record", userId, duelchamp.records);
            return false;
        } catch (err) {
            con.error("ERROR in duelchamp.deleteItem: " + err);
            return false;
        }
    };

    duelchamp.hashCheck = function(record) {
        try {
            var hash = '',
                hashes = [
                    "3f56e5f147545c2069f615aa2ebc80d2eef34d48",
                    "8caeb4b385c1257419ee18dee47cfa3a1271ba77",
                    "02752cf4b979dd5a77b53694917a60f944cb772f",
                    "c644f2fdcf1a7d721b82efab5313df609442c4f9",
                    "8d29caf6400807789964185405b0f442e6cacae7",
                    "7f04c6d6d1110ce05532ca508efde5dbafe7ec17"
                ];

            if (!hashes.length || !(gm ? gm.getItem('AllowProtected', true, hiddenVar) : true)) {
                return false;
            }

            if (record.userId === '' || $u.isNaN(record.userId) || record.userId < 1) {
                con.warn("userId", record);
                throw "Invalid identifying userId!";
            }

            hash = (record.userId.toString().SHA1() + record.nameStr).SHA1();
            return (hashes.hasIndexOf(hash));
        } catch (err) {
            con.error("ERROR in duelchamp.hashCheck: " + err);
            return false;
        }
    };

    duelchamp.flagResult = false;

    duelchamp.getResult = function() {
        try {
            var bottomDiv = $j(),
                buttonDiv = $j(),
                targetDiv = $j(),
                tempText = '',
                result = 'unknown',
                type = 'unknown',
                name = 'unknown',
                userId = -1,
                points = -1,
                it = 0,
                len = 0,
                duelchampRecord = {},
                tempTime = 0,
                chainDCP = '',
                maxChains = 0;

            if (!$u.hasContent(slice)) {
                con.warn("No slice passed to duelchamp.getResults");
                bottomDiv = null;
                buttonDiv = null;
                targetDiv = null;
                return;
            }

            tempText = slice.attr('style');
            if ($u.hasContent(tempText)) {
                result = $u.setContent(tempText.regex(/war_fort_battle(\S+).jpg/), 'unknown');
                if (!$u.hasContent(result) || (result !== 'victory' && result !== 'defeat')) {
                    con.warn("duelchamp.battle: result unknown", tempText);
                }
            } else {
                con.warn("duelchamp.battle: missing resultDiv");
            }

            bottomDiv = $j("#app_body div[style*='conqduel_battlebottom2.jpg']");
            if ($u.hasContent(bottomDiv)) {
                targetDiv = $j("input[name='target_id']", bottomDiv);
                if ($u.hasContent(targetDiv)) {
                    tempText = targetDiv.val();
                    if ($u.hasContent(tempText)) {
                        userId = $u.setContent(tempText.regex(/(\d+)/i), -1);
                        if (!$u.hasContent(userId) || userId === -1) {
                            con.warn("duelchamp.battle: userId unknown", tempText);
                        }
                    } else {
                        con.warn("duelchamp.battle: missing targetDiv tempText");
                    }
                } else {
                    con.warn("duelchamp.battle: missing targetDiv");
                }

                targetDiv = bottomDiv.children().eq(1);
                if ($u.hasContent(targetDiv)) {
                    tempText = targetDiv.text();
                    if ($u.hasContent(tempText)) {
                        name = $u.setContent(tempText.regex(/\s+(.+)\s+\d+ Duel Champion Rank Pts/i), '').trim().innerTrim();
                        if (!$u.hasContent(name) || name === '') {
                            con.warn("duelchamp.battle: name unknown", tempText);
                        }
                    } else {
                        con.warn("duelchamp.battle: missing name targetDiv tempText");
                    }
                } else {
                    con.warn("duelchamp.battle: missing name targetDiv");
                }

                buttonDiv = $j(input[src*='festival_duelchamp_duelagain_btn.gif']", bottomDiv);
                if ($u.hasContent(buttonDiv)) {
                    tempText = buttonDiv.attr('src');
                    if ($u.hasContent(tempText)) {
                        type = $u.setContent(tempText.regex(/war_(\S+)againbtn.gif/), 'unknown');
                        if (!$u.hasContent(type) || (type !== 'duelchamp')) {
                            con.warn("duelchamp.battle: type unknown", tempText);
                        }
                    } else {
                        con.warn("duelchamp.battle: missing buttonDiv tempText");
                    }
                } else {
                    con.warn("duelchamp.battle: missing buttonDiv");
                }

                tempText = $u.setContent(bottomDiv.text(), '');
                if ($u.hasContent(tempText)) {
                    points = $u.setContent(tempText.regex(/(\d+) Duel Champion Rank Pts/), -1);
                    if (!$u.hasContent(points) || points === -1) {
                        con.warn("duelchamp.battle: missing Duel Champion Rank Pts", tempText);
                    }
                } else {
                    con.warn("duelchamp.battle: missing bottomDiv tempText");
                }
            } else {
                con.warn("duelchamp.battle: missing bottomDiv");
            }

            con.log(1, "duelchamp.getResults", userId, name, type, result, points);

            if (userId > 0)  {
                con.log(1, "Searching targets on page");
                for (it = 0, len = duelchamp.targetsOnPage.length; it < len; it += 1) {
                    if (duelchamp.targetsOnPage[it].userId === userId) {
                        duelchampRecord = duelchamp.targetsOnPage[it];
                    }
                }

                if (!$u.hasContent(duelchampRecord)) {
                    con.log(1, "No target record found, searching/creating duel champion records");
                    duelchampRecord = duelchamp.getItem(userId);
                } else {
                    con.log(1, "Target found on page", duelchampRecord);
                }

                duelchampRecord.attackTime = Date.now();
                if ($u.hasContent(name) && name !== 'unknown' && name !== duelchampRecord.nameStr) {
                    con.log(1, "Updating duel champion record user name, from/to", duelchampRecord.nameStr, name);
                    duelchampRecord.nameStr = name;
                }

                if ($u.hasContent(result) && (result === 'victory' || result === 'defeat')) {
                    if ($u.hasContent(type) && (type === 'duelchamp')) {
                        if (type === 'duelchamp') {
                          if (result === 'victory') {
                                duelchampRecord.statswinsNum += 1;
                                duelchampRecord.duelchampwinsNum += 1;
                                duelchampRecord.dcbp += points;
                        } else {
                                duelchampRecord.statslossesNum += 1;
                                duelchampRecord.duelchamplossesNum += 1;
                                duelchampRecord.dcbp -= points;
                                duelchampRecord.duelchampLostTime = Date.now();
                            }
                        }

                        if (result === 'victory') {
                            con.log(1, "Chain check");
                            //Test if we should chain this guy
                            tempTime = $u.setContent(duelchampRecord.chainTime, 0);
                            chainDCP = config.getItem('DuelchampChainDCP', '');
                            if (schedule.since(tempTime, 86400) && ((chainDCP !== '' && !$u.isNaN(chainDCP) && chainDCP >= 0))) {
                                if (chainDCP !== '' && !$u.isNaN(chainDCP) && chainDCP >= 0) {
                                    if (points >= chainDCP) {
                                        state.setItem("DuelchampChainId", duelchampRecord.userId);
                                        con.log(1, "Chain Attack:", duelchampRecord.userId, "Duel Champion Points: " + points);
                                    } else {
                                        con.log(1, "Ignore Chain Attack:", duelchampRecord.userId, "Duel Champion Points: " + points);
                                        duelchampRecord.ignoreTime = Date.now();
                                    }
                                }
                            }

                            duelchampRecord.chainCount = duelchampRecord.chainCount ? duelchampRecord.chainCount += 1 : 1;
                            maxChains = config.getItem('DuelchampMaxChains', 4);
                            if (maxChains === '' || $u.isNaN(maxChains) || maxChains < 0) {
                                maxChains = 4;
                            }

                            if (duelchampRecord.chainCount >= maxChains) {
                                con.log(1, "Lets give this guy a break. Chained", duelchampRecord.chainCount);
                                duelchampRecord.chainTime = Date.now();
                                duelchampRecord.chainCount = 0;
                                duelchampRecord.ignoreTime = 0;
                                duelchampRecord.unknownTime = 0;
                            }
                        } else {
                            con.log(1, "Do Not Chain Attack:", duelchampRecord.userId);
                            duelchampRecord.chainCount = 0;
                            duelchampRecord.chainTime = 0;
                            duelchampRecord.ignoreTime = 0;
                            duelchampRecord.unknownTime = 0;
                        }
                    } else {
                        con.warn("Setting unknown timer as duel champion type unknown", type);
                        duelchampRecord.chainCount = 0;
                        duelchampRecord.chainTime = 0;
                        duelchampRecord.ignoreTime = 0;
                        duelchampRecord.unknownTime = Date.now();
                    }
                } else {
                    con.warn("Setting unknown timer as duel champion result unknown", result);
                    duelchamp.chainCount = 0;
                    duelchampRecord.chainTime = 0;
                    duelchampRecord.ignoreTime = 0;
                    duelchampRecord.unknownTime = Date.now();
                }

                duelchamp.setItem(duelchampRecord);
            } else {
                con.error("Unable to process records without valid userId", userId);
            }

            bottomDiv = null;
            buttonDiv = null;
            targetDiv = null;
        } catch (err) {
            con.error("ERROR in duelchamp.getResults: " + err);
        }
    };
   
    duelchamp.deadCheck = function() {
        try {
            var duelchampRecord = {},
                dead = false;

            if (state.getItem("lastDuelchampID", 0)) {
                duelchampRecord = duelchamp.getItem(state.getItem("lastDuelchampID", 0));
            }

            if ($u.hasContent($j("#app_body #results_main_wrapper"))) {
                if ($u.hasContent(caap.resultsText)) {
                    if (/Your opponent is dead or too weak to duelchamp/.test(caap.resultsText)) {
                        con.log(1, "This opponent is dead or hiding: ", state.getItem("lastDuelchampID", 0));
                        if ($j.isPlainObject(duelchampRecord) && !$j.isEmptyObject(duelchampRecord)) {
                            duelchampRecord.deadTime = Date.now();
                        }

                        dead = true;
                    }
                } else {
                    if ($j.isPlainObject(duelchampRecord) && !$j.isEmptyObject(duelchampRecord)) {
                        duelchampRecord.unknownTime = Date.now();
                    }

                    con.warn("Unable to determine if user is dead!");
                    dead = null;
                }
            } else {
                if ($j.isPlainObject(duelchampRecord) && !$j.isEmptyObject(duelchampRecord)) {
                    duelchampRecord.unknownTime = Date.now();
                }

                con.warn("Unable to find any results!");
                dead = null;
            }

            if (dead !== false && $j.isPlainObject(duelchampRecord) && !$j.isEmptyObject(duelchampRecord)) {
                duelchamp.setItem(duelchampRecord);
            }

            return dead;
        } catch (err) {
            con.error("ERROR in duelchamp.deadCheck: " + err);
            return undefined;
        }
    };

    duelchamp.checkResults = function() {
        try {
            var duelchampRecord = {},
                tempTime = 0,
                chainDCP = 0,
                maxChains = 0,
                result = {};

            if (!duelchamp.flagResult) {
                return true;
            }

            con.log(2, "Checking Duel Champion Results");
            duelchamp.flagResult = false;
            state.setItem("DuelchampChainId", 0);
            if (duelchamp.deadCheck() !== false) {
                return true;
            }

            result = duelchamp.getResult();
            if (!result || result.hiding === true) {
                return true;
            }

            if (result.unknown === true) {
                if (state.getItem("lastDuelchmapID", 0)) {
                    duelchampRecord = duelchamp.getItem(state.getItem("lastDuelchampID", 0));
                    duelchampRecord.unknownTime = Date.now();
                    duelchamp.setItem(duelchampRecord);
                }

                return true;
            }

            duelchampRecord = duelchamp.getItem(result.userId);
            if (result.win) {
                con.log(1, "We Defeated ", result.userName, ((result.duelchampType === "War") ? "War Points: " : "Battle Points: ") + result.points );
                //Test if we should chain this guy
                tempTime = $u.setContent(duelchampRecord.chainTime, 0);
                chainDCP = config.getItem('ChainDCP', '');
                if (schedule.since(tempTime, 86400) && ((chainDCP !== '' && !$u.isNaN(chainDCP) && chainDCP >= 0))) {
                    if (chainDCP !== '' && !$u.isNaN(chainDCP) && chainDCP >= 0) {
                        if (result.points >= chainDCP) {
                            state.setItem("DuelchampChainId", result.userId);
                            con.log(1, "Chain Attack:", result.userId, ((result.duelchampType === "War") ? "Duel Champion Points: " : "Battle Points: ") + result.points);
                        } else {
                            duelchampRecord.ignoreTime = Date.now();
                        }
                    }
                }

                duelchampRecord.chainCount = duelchampRecord.chainCount ? duelchampRecord.chainCount += 1 : 1;
                maxChains = config.getItem('MaxChains', 4);
                if (maxChains === '' || $u.isNaN(maxChains) || maxChains < 0) {
                    maxChains = 4;
                }

                if (duelchampRecord.chainCount >= maxChains) {
                    con.log(1, "Lets give this guy a break. Chained", duelchampRecord.chainCount);
                    duelchampRecord.chainTime = Date.now();
                    duelchampRecord.chainCount = 0;
                }

            } else {
                con.log(1, "We Were Defeated By ", result.userName);
                duelchampRecord.chainCount = 0;
                duelchampRecord.chainTime = 0;
            }

            duelchamp.setItem(duelchampRecord);
            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.checkResults: " + err);
            return false;
        }
    };

    duelchamp.nextTarget = function() {
        state.setItem('DuelchampTargetUpto', state.getItem('DuelchampTargetUpto', 0) + 1);
    };

    duelchamp.getTarget = function(mode) {
        try {
            var target = '',
                targets = [],
                duelchampUpto = '',
                targetType = '',
                targetDuelchamp = '';

            targetType = config.getItem('TargetType', 'Freshmeat');
            if (targetType === 'Freshmeat') {
                return 'Freshmeat';
            }

            target = state.getItem('DuelchampChainId', 0);
            if (target) {
                return target;
            }

            targets = config.getList('DuelchampTargets', '');
            if (!targets.length) {
                return false;
            }

            duelchampUpto = state.getItem('DuelchampTargetUpto', 0);
            if (duelchampUpto > targets.length - 1) {
                duelchampUpto = 0;
                state.setItem('DuelchampTargetUpto', 0);
            }

            if (!targets[battleUpto]) {
                battle.nextTarget();
                return false;
            }

            caap.setDivContent('duelchamp_mess', 'Challenging User ' + duelchampUpto + '/' + targets.length + ' ' + targets[duelchampUpto]);
            return targets[duelchampUpto];
        } catch (err) {
            con.error("ERROR in duelchamp.getTarget: " + err);
            return false;
        }
    };

    duelchamp.click = function(duelchampButton) {
        try {
            session.setItem('ReleaseControl', true);
            duelchamp.flagResult = true;
            caap.setDomWaiting("festival_duel_battle.php");
            caap.click(duelchampButton);
            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.click: " + err);
            return false;
        }
    };

    duelchamp.battles = {
         'Duelchamp': 'festival_duelchamp_challenge_btn.gif',
         'DuelchampChain': 'festival_duelchamp_duelagain_btn.gif'
    };

    duelchamp.freshmeat = function(type, slice) {
        try {
            var buttonType = type === 'Raid' ? config.getItem('BattleType', 'Invade') + state.getItem('RaidStaminaReq', 1) : config.getItem('BattleType', 'Invade'),
                inputDiv = $j("input[src*='" + duelchamp.battles[type === "recon" ? "Freshmeat" : type][buttonType] + "']", (type === "recon" && slice ? $j(slice) : $j("#app_body"))),
                plusOneSafe = false,
                safeTargets = [],
                chainId = '',
                chainAttack = false,
                inp = $j(),
                txt = '',
                minRank = 0,
                maxLevel = 0,
                minLevel = 0,
                duelchampRecord = {},
                it = 0,
                itx,
                len = 0,
                form = $j(),
                firstId = '',
                lastDuelchampID = 0,
                engageButton = $j(),
                time = 0,
                found = 0,
                entryLimit = 0,
                noSafeCount = 0,
                noSafeCountSet = 0;

            if (!$u.hasContent(inputDiv)) {
                con.warn('Not on duelchamppage');
                caap.navigateTo(caap.duelchampPage);
                inputDiv = null;
                inp = null;
                form = null;
                engageButton = null;
                return false;
            }

            chainId = state.getItem('DuelchampChainId', 0);
            state.setItem('DuelchampChainId', '');
            // Lets get our Freshmeat user settings
            minRank = config.getItem("FreshMeatMinRank", 99);
            con.log(3, "FreshMeatMinRank", minRank);
            if (minRank === '' || $u.isNaN(minRank)) {
                if (minRank !== '') {
                    con.warn("FreshMeatMinRank is NaN, using default", 99);
                }

                minRank = 99;
            }

            maxLevel = config.getItem("FreshMeatMaxLevel", 99999);
            con.log(3, "FreshMeatMaxLevel", maxLevel);
            if (maxLevel === '' || $u.isNaN(maxLevel)) {
                if (maxLevel !== '') {
                    con.warn("FreshMeatMaxLevel is NaN, using default", maxLevel);
                }

                maxLevel = 99999;
            }

            minLevel = config.getItem("FreshMeatMinLevel", 99999);
            con.log(3, "FreshMeatMinLevel", minLevel);
            if (minLevel === '' || $u.isNaN(minLevel)) {
                if (minLevel !== '') {
                    con.warn("FreshMeatMinLevel is NaN, using default", minLevel);
                }

                minLevel = 99999;
            }

            inputDiv.each(function(index) {
                var tr = $j(),
                    levelm = [],
                    tempTxt = '',
                    tNum = 0,
                    tempTime = -1,
                    i = 0,
                    len = 0,
                    tempRecord = type === "recon" ? new duelchamp.reconRecord() : new duelchamp.record();

                tempRecord.data.button = $j(this);
                if (type === 'Duelchamp') {
                    tr = tempRecord.data.button.parents().eq(4);
                } else {
                    tr = tempRecord.data.button.parents("tr").eq(0);
                }

                inp = $j("input[name='target_id']", tr);
                if (!$u.hasContent(inp)) {
                    con.warn("Could not find 'target_id' input");
                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                tempRecord.data.userId = $u.setContent(inp.val(), '0').parseInt();
                if (!$u.isNumber(tempRecord.data.userId) || tempRecord.data.userId <= 0) {
                    con.warn("Not a valid userId", tempRecord.data.userId);
                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                if (type === "recon") {
                    for (i = 0, len = duelchamp.reconRecords.length; i < len; i += 1) {
                        if (duelchamp.reconRecords[i].userId === tempRecord.data.userId) {
                            tempRecord.data = duelchamp.reconRecords[i];
                            duelcahmp.reconRecords.splice(i, 1);
                            con.log(2, "UserRecord exists. Loaded and removed.", tempRecord);
                            break;
                        }
                    }
                }

                if (type === 'Duelchamp') {
                    tempTxt = $u.setContent(tr.children().eq(1).text(), '').trim();
                    levelm = duelchamp.battles.Duelchamp.regex1.exec(tempTxt);
                    if (!$u.hasContent(levelm)) {
                        con.warn("Can't match Raid regex in ", tempTxt);
                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        tr = null;
                        return true;
                    }

                    tempRecord.data.nameStr = $u.setContent(levelm[1], '').trim();
                    tempRecord.data.rankNum = $u.setContent(levelm[2], '').parseInt();
                    tempRecord.data.rankStr = duelchamp.duelchampRankTable[tempRecord.data.rankNum];
                    tempRecord.data.levelNum = $u.setContent(levelm[4], '').parseInt();
                    tempRecord.data.armyNum = $u.setContent(levelm[6], '').parseInt();
                } else {
                    if (!$u.hasContent(tr)) {
                        con.warn("Can't find parent tr in tempRecord.data.button");
                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        tr = null;
                        return true;
                    }

                    tNum = $u.setContent($j("img[src*='symbol_']", tr).attr("src"), '').regex(/(\d+)\.jpg/i);
                    if ($u.hasContent(tNum)) {
                        tempRecord.data.deityNum = tNum - 1;
                        if (tempRecord.data.deityNum >= 0 && tempRecord.data.deityNum <= 4) {
                            tempRecord.data.deityStr = caap.demiTable[tempRecord.data.deityNum];
                        } else {
                            con.warn("Demi number is not between 0 and 4", tempRecord.data.deityNum);
                            tempRecord.data.deityNum = 0;
                            tempRecord.data.deityStr = caap.demiTable[tempRecord.data.deityNum];
                        }
                    } else {
                        con.warn("Unable to match demi number in tempTxt");
                    }

                    // If looking for demi points, and already full, continue
                    if (type !== "recon") {
                        if (config.getItem('DemiPointsFirst', false) && !state.getItem('DemiPointsDone', true) && (config.getItem('WhenMonster', 'Never') !== 'Never')) {
                            if (caap.demi[tempRecord.data.deityStr].daily.dif <= 0 || !config.getItem('DemiPoint' + tempRecord.data.deityNum, true)) {
                                con.log(2, "Daily Demi Points done for", tempRecord.data.deityStr);
                                inputDiv = null;
                                inp = null;
                                form = null;
                                engageButton = null;
                                tr = null;
                                return true;
                            }
                        } else if (config.getItem('WhenDuelchamp', 'Never') === "Demi Points Only") {
                            if (caap.demi[tempRecord.data.deityStr].daily.dif <= 0) {
                                con.log(2, "Daily Demi Points done for", tempRecord.data.deityStr);
                                inputDiv = null;
                                inp = null;
                                form = null;
                                engageButton = null;
                                tr = null;
                                return true;
                            }
                        }
                    }

                    tempTxt = $u.setContent(tr.text(), '').trim();
                    if (!$u.hasContent(tempTxt)) {
                        con.warn("Can't find tempTxt in tr");
                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        tr = null;
                        return true;
                    }

                    if (duelchamp.battles.Freshmeat.duelchampLevel) {
                        levelm = duelchamp.battles.Freshmeat.regex1.exec(tempTxt);
                        if (!levelm) {
                            levelm = duelchamp.battles.Freshmeat.regex2.exec(tempTxt);
                            duelchamp.battles.Freshmeat.duelchampLevel = false;
                        }
                    } else {
                        levelm = duelchamp.battles.Freshmeat.regex2.exec(tempTxt);
                        if (!levelm) {
                            levelm = duelchamp.battles.Freshmeat.regex1.exec(tempTxt);
                            duelchamp.battles.Freshmeat.duelchampLevel = true;
                        }
                    }

                    if (!levelm) {
                        con.warn("Can't match Freshmeat regex in ", tempTxt);
                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        tr = null;
                        return true;
                    }

                    tempRecord.data.nameStr = $u.setContent(levelm[1], '').trim();
                    tempRecord.data.levelNum = $u.setContent(levelm[2], '').parseInt();
                    tempRecord.data.rankStr = $u.setContent(levelm[3], '').trim();
                    tempRecord.data.rankNum = $u.setContent(levelm[4], '').parseInt();
                    if (duelchamp.battles.Freshmeat.duelLevel) {
                        tempRecord.data.duelchampRankStr = $u.setContent(levelm[5], '').trim();
                        tempRecord.data.duelchampRankNum = $u.setContent(levelm[6], '').parseInt();
                        tempRecord.data.armyNum = $u.setContent(levelm[7], '').parseInt();
                    } else {
                        tempRecord.data.armyNum = $u.setContent(levelm[5], '').parseInt();
                    }
                }

                if (duelchamp.hashCheck(tempRecord.data)) {
                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                if (tempRecord.data.levelNum - caap.stats.level > maxLevel) {
                    con.log(2, "Exceeds relative maxLevel", {
                        'level': tempRecord.data.levelNum,
                        'levelDif': tempRecord.data.levelNum - caap.stats.level,
                        'maxLevel': maxLevel
                    });

                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                if (caap.stats.level - tempRecord.data.levelNum > minLevel) {
                    con.log(2, "Exceeds relative minLevel", {
                        'level': tempRecord.data.levelNum,
                        'levelDif': caap.stats.level - tempRecord.data.levelNum,
                        'minLevel': minLevel
                    });

                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                if (config.getItem("DuelchampType", 'Duelchamp') === "Duelchamp" && duelchamp.battles.Freshmeat.duelchampLevel) {
                    if (caap.stats.rank.duelchamp && (caap.stats.rank.duelchamp - tempRecord.data.duelchampRankNum > minRank)) {
                        con.log(2, "Greater than duel champion minRank", {
                            'rankDif': caap.stats.rank.duelchamp - tempRecord.data.duelchampRankNum,
                            'minRank': minRank
                        });

                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        tr = null;
                        return true;
                    }
                } else {
                    if (caap.stats.rank.duelchamp && (caap.stats.rank.duelchamp - tempRecord.data.duelchampNum > minRank)) {
                        con.log(2, "Greater than duel challenge minRank", {
                            'rankDif': caap.stats.rank.duelchamp - tempRecord.data.duelchampNum,
                            'minRank': minRank
                        });

                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        tr = null;
                        return true;
                    }
                }

                if (type === "recon") {
                    tempRecord.data.aliveTime = Date.now();
                    entryLimit = config.getItem("LimitTargets", 100);
                    while (duelchamp.reconRecords.length >= entryLimit) {
                        con.log(2, "Entry limit matched. Deleted an old record", duelchamp.reconRecords.shift());
                    }

                    delete tempRecord.data.button;
                    con.log(2, "Push UserRecord", tempRecord);
                    duelchamp.reconRecords.push(tempRecord.data);
                    found += 1;

                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                if (config.getItem("DuelchampType", 'Duelchamp') === duelchamp.battles.Freshmeat.duelchampLevel) {
                    con.log(1, "ID: " + tempRecord.data.userId.toString().rpad(" ", 15) + " Level: " + tempRecord.data.levelNum.toString().rpad(" ", 4) +
                        " Duel Champion Rank: " + tempRecord.data.duelchampRankNum.toString().rpad(" ", 2) + " Army: " + tempRecord.data.armyNum);
                } else {
                    con.log(1, "ID: " + tempRecord.data.userId.toString().rpad(" ", 15) + " Level: " + tempRecord.data.levelNum.toString().rpad(" ", 4) +
                        " Battle Rank: " + tempRecord.data.rankNum.toString().rpad(" ", 2) + " Army: " + tempRecord.data.armyNum);
                }

                // don't battle people we lost to in the last week
                duelchampRecord = duelchamp.getItem(tempRecord.data.userId);
                if (!config.getItem("IgnoreDuelchampLoss", false)) {
                    switch (config.getItem("DuelchampType", 'Duelchamp')) {
                    case 'Duelchamp':
                        tempTime = $u.setContent(duelchampRecord.invadeLostTime, 0);

                        break;
                    default:
                        con.warn("Duel Champion type unknown!", config.getItem("DuelchampType", 'Duelchamp'));
                    }

                    if (duelchampRecord && !duelchampRecord.newRecord && tempTime && !schedule.since(tempTime, 604800)) {
                        con.log(1, "We lost " + config.getItem("DuelchampType", 'Duelchamp') + " to this id this week: ", tempRecord.data.userId);
                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        tr = null;
                        return true;
                    }
                }

                // don't battle people that results were unknown in the last hour
                tempTime = $u.setContent(duelchampRecord.unknownTime, 0);
                if (duelchampRecord && !duelchampRecord.newRecord && !schedule.since(tempTime, 3600)) {
                    con.log(1, "User was challenged but results unknown in the last hour: ", tempRecord.data.userId);
                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                // don't battle people that were dead or hiding in the last hour
                tempTime = $u.setContent(duelchampRecord.deadTime, 0);
                if (duelchampRecord && !duelchampRecord.newRecord && !schedule.since(tempTime, 3600)) {
                    con.log(1, "User was dead in the last hour: ", tempRecord.data.userId);
                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                // don't battle people we've already chained to max in the last 2 days
                tempTime = $u.setContent(duelchampRecord.chainTime, 0);
                if (duelchampRecord && !duelchampRecord.newRecord && !schedule.since(tempTime, 86400)) {
                    con.log(1, "We chained user within 2 days: ", tempRecord.data.userId);
                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                // don't battle people that didn't meet chain points in the last week
                tempTime = $u.setContent(duelchampRecord.ignoreTime, 0);
                if (duelchampRecord && !duelchampRecord.newRecord && !schedule.since(tempTime, 604800)) {
                    con.log(1, "User didn't meet chain requirements this week: ", tempRecord.data.userId);
                    inputDiv = null;
                    inp = null;
                    form = null;
                    engageButton = null;
                    tr = null;
                    return true;
                }

                tempRecord.data.targetNumber = index + 1;
                con.log(3, "tempRecord/levelm", tempRecord.data, levelm);
                safeTargets.push(tempRecord.data);
                tempRecord = null;
                if (index === 0 && type === 'Raid') {
                    plusOneSafe = true;
                }

                inputDiv = null;
                inp = null;
                form = null;
                engageButton = null;
                tr = null;
                return true;
            });

            safeTargets.sort($u.sortBy(true, "score"));
            if ($u.hasContent(safeTargets)) {
                if (chainAttack) {
                    form = inputDiv.eq(0).parent().parent();
                    inp = $j("input[name='target_id']", form);
                    if ($u.hasContent(inp)) {
                        inp.attr("value", chainId);
                        con.log(1, "Chain attacking: ", chainId);
                        duelchamp.click(inputDiv.eq(0), type);
                        state.setItem("lastDuelchampID", chainId);
                        caap.setDivContent('duelchamp_mess', 'Attacked: ' + state.getItem("lastDuelchampID", 0));
                        state.setItem("notSafeCount", 0);
                        inputDiv = null;
                        inp = null;
                        form = null;
                        engageButton = null;
                        return true;
                    }

                    con.warn("Could not find 'target_id' input");
                } else {
                    lastDuelchampID = state.getItem("lastDuelchampID", 0);
                    for (it = 0, len = safeTargets.length; it < len; it += 1) {
                        // current thinking is that continue should not be used as it can cause reader confusion
                        // therefore when linting, it throws a warning
                        /*jslint continue: true */
                        if (!lastDuelchampID && lastDuelchampID === safeTargets[it].id) {
                            continue;
                        }
                        /*jslint continue: false */

                        if ($u.isDefined(safeTargets[it].button)) {
                            con.log(2, 'Found Target score: ' + safeTargets[it].score.dp(2) + ' id: ' + safeTargets[it].userId + ' Number: ' + safeTargets[it].targetNumber);
                            duelchamp.click(safeTargets[it].button, type);
                            delete safeTargets[it].score;
                            delete safeTargets[it].targetNumber;
                            delete safeTargets[it].button;
                            duelchampRecord = duelchamp.getItem(safeTargets[it].userId);
                            if (duelchampRecord.newRecord) {
                                state.setItem("lastDuelchampID", safeTargets[it].userId);
                                $j.extend(true, duelchampRecord, safeTargets[it]);
                                duelchampRecord.newRecord = false;
                                duelchampRecord.aliveTime = Date.now();
                            } else {
                                duelchampRecord.aliveTime = Date.now();
                                for (itx in safeTargets[it]) {
                                    if (safeTargets[it].hasOwnProperty(itx)) {
                                        if (!$u.hasContent(duelchampRecord[itx] && $u.hasContent(safeTargets[it][itx]))) {
                                            duelchampRecord[itx] = safeTargets[it][itx];
                                        }

                                        if ($u.hasContent(safeTargets[it][itx]) && $u.isString(safeTargets[it][itx]) && duelchampRecord[itx] !== safeTargets[it][itx]) {
                                            duelchampRecord[itx] = safeTargets[it][itx];
                                        }

                                        if ($u.hasContent(safeTargets[it][itx]) && $u.isNumber(safeTargets[it][itx]) && duelchampRecord[itx] < safeTargets[it][itx]) {
                                            duelchampRecord[itx] = safeTargets[it][itx];
                                        }
                                    }
                                }
                            }

                            duelchamp.setItem(duelchampRecord);
                            caap.setDivContent('duelchamp_mess', 'Challenged: ' + lastDuelchampID);
                            state.setItem("notSafeCount", 0);
                            inputDiv = null;
                            inp = null;
                            form = null;
                            engageButton = null;
                            return true;
                        }

                        con.warn('Challenge button is null or undefined');
                    }
                }
            }

            noSafeCount = state.setItem("notSafeCount", state.getItem("notSafeCount", 0) + 1);
            noSafeCountSet = config.getItem("notSafeCount", 20);
            noSafeCountSet = noSafeCountSet < 1 ? 1 : noSafeCountSet;
            if (noSafeCount >= noSafeCountSet) {
                caap.setDivContent('duelchamp_mess', 'Leaving Duel Champion. Will Return Soon.');
                con.log(1, 'No safe targets limit reached. Releasing control for other processes: ', noSafeCount);
                state.setItem("notSafeCount", 0);
                time = config.getItem("NoTargetDelay", 45);
                time = time < 10 ? 10 : time;
                schedule.setItem("NoTargetDelay", time);
                inputDiv = null;
                inp = null;
                form = null;
                engageButton = null;
                return false;
            }

            caap.setDivContent('duelchamp_mess', 'No targets matching criteria');
            con.log(1, 'No safe targets: ', noSafeCount);
            inputDiv = null;
            inp = null;
            form = null;
            engageButton = null;
            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.freshmeat: " + err);
            return false;
        }
    };
    
    duelchamp.menu = function() {
        try {
            var XDuelchampInstructions = "Start challenging if stamina is above this points",
                XMinDuelchampInstructions = "Do not challenge if stamina is below this points",
                safeHealthInstructions = "Wait until health is 13 instead of 10, prevents you killing yourself but leaves you unhidden for upto 15 minutes",
                userIdInstructions = "User IDs(not user name).  Click with the " + "right mouse button on the link to the users profile & copy link." + "  Then paste it here and remove everything but the last numbers." + " (ie. 123456789)",
                chainDCPInstructions = "Number of challenge points won to initiate a chain attack. Specify 0 to always chain attack.",
                maxChainsInstructions = "Maximum number of chain hits after the initial attack.",
                FMRankInstructions = "The lowest relative rank below yours that " + "you are willing to spend your stamina on. Leave blank to attack " + "any rank. (Uses Duel Champion Rank for challenge.)",
                FreshMeatMaxLevelInstructions = "This sets the highest relative level, above yours, that you are willing to attack. So if you are a level 100 and do not want to attack an opponent above level 120, you would code 20.",
                FreshMeatMinLevelInstructions = "This sets the lowest relative level, below yours, that you are willing to attack. So if you are a level 100 and do not want to attack an opponent below level 60, you would code 40.",
                duelchampList = ['Stamina Available', 'At Max Stamina', 'At X Stamina', 'No Monster', 'Stay Hidden', 'Never'],
                duelchampInst = [
                    'Stamina Available will challenge whenever you have enough stamina',
                    'At Max Stamina will challenge when stamina is at max and will burn down all stamina when able to level up',
                    'At X Stamina you can set maximum and minimum stamina to challenge',
                    'No Monster will challenge only when there are no active monster battles.',
                    'Stay Hidden uses stamina to try to keep you under 10 health so you cannot be attacked, while also attempting to maximize your stamina use for Monster attacks.',
                    'Never - disables player battles'
                ],
                typeList = ['Duelchamp'],
                typeInst = ['Battle using Challenge button', 'No guarentee you will win though'],
                targetList = ['Freshmeat', 'Userid List'],
                targetInst = ['Use settings to select a target from the Challenge Page', 'Select target from the supplied list of userids'],
            htmlCode = '';

            htmlCode = caap.startToggle('Challenging', 'DUEL CHAMPION');
            htmlCode += caap.makeDropDownTR("Battle When", 'WhenBattle', battleList, battleInst, '', 'Never', false, false, 62);
            htmlCode += caap.startDropHide('WhenBattle', '', 'Never', true);
            htmlCode += "<div id='caap_WhenBattleStayHidden_hide' style='color: red; font-weight: bold; display: ";
            htmlCode += (config.getItem('WhenBattle', 'Never') === 'Stay Hidden' && config.getItem('WhenMonster', 'Never') !== 'Stay Hidden' ? 'block' : 'none') + "'>";
            htmlCode += "Warning: Monster Not Set To 'Stay Hidden'";
            htmlCode += "</div>";
            htmlCode += caap.startDropHide('WhenBattle', 'XStamina', 'At X Stamina', false);
            htmlCode += caap.makeNumberFormTR("Start At Or Above", 'XBattleStamina', XBattleInstructions, 1, '', '', true, false);
            htmlCode += caap.makeNumberFormTR("Stop At Or Below", 'XMinBattleStamina', XMinBattleInstructions, 0, '', '', true, false);
            htmlCode += caap.endDropHide('WhenBattle', 'XStamina');
            htmlCode += caap.makeDropDownTR("Battle Type", 'BattleType', typeList, typeInst, '', '', false, false, 62);
            htmlCode += caap.makeCheckTR("Wait For Safe Health", 'waitSafeHealth', false, safeHealthInstructions);
            htmlCode += caap.makeNumberFormTR("Chain Duel Champion Points", 'ChainDCP', chainDCPInstructions, '', '');
            htmlCode += caap.makeNumberFormTR("Max Chains", 'MaxChains', maxChainsInstructions, 4, '', '');
            htmlCode += caap.makeTD("Attack targets that are not:");
            htmlCode += caap.makeNumberFormTR("Lower Than Rank Minus", 'FreshMeatMinRank', FMRankInstructions, '', '', '');
            htmlCode += caap.makeNumberFormTR("Higher Than X*AR", 'FreshMeatARBase', FMARBaseInstructions, 0.5, '', '');
            htmlCode += caap.makeCheckTR('Advanced', 'AdvancedFreshMeatOptions', false);
            htmlCode += caap.startCheckHide('AdvancedFreshMeatOptions');
            htmlCode += caap.makeNumberFormTR("Max Level", 'FreshMeatMaxLevel', FreshMeatMaxLevelInstructions, '', '', '', true);
            htmlCode += caap.makeNumberFormTR("Min Level", 'FreshMeatMinLevel', FreshMeatMinLevelInstructions, '', '', '', true);
            htmlCode += caap.endCheckHide('AdvancedFreshMeatOptions');
            htmlCode += caap.makeDropDownTR("Target Type", 'TargetType', targetList, targetInst, '', '', false, false, 62);
            htmlCode += caap.startDropHide('TargetType', 'UserId', 'Userid List', false);
            htmlCode += caap.makeTextBox('BattleTargets', userIdInstructions, '');
            htmlCode += caap.endDropHide('TargetType', 'UserId');
            htmlCode += caap.endDropHide('WhenBattle');
            htmlCode += caap.endToggle;
            return htmlCode;
        } catch (err) {
            con.error("ERROR in duelchamp.menu: " + err);
            return '';
        }
    };

    duelchamp.dashboard = function() {
        function points(num) {
            num = $u.setContent(num, 0);
            return num >= 0 ? "+" + num : num;
        }

        try {
            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_infoDuelChamp' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (config.getItem('DBDisplay', '') === 'Duel Champion Stats' && session.getItem("DuelchampDashUpdate", true)) {
                var headers = ['UserId', 'Name', 'DCR', 'Level', 'Duel'],
                    values = ['userId', 'nameStr', 'duelchampNum', 'levelNum', 'duelchampwinsNum'],
                    pp = 0,
                    i = 0,
                    userIdLink = '',
                    userIdLinkInstructions = '',
                    len = 0,
                    len1 = 0,
                    data = {
                        text: '',
                        color: '',
                        bgcolor: '',
                        id: '',
                        title: ''
                    },
                    head = '',
                    body = '',
                    row = '';

                for (pp = 0; pp < headers.length; pp += 1) {
                    switch (headers[pp]) {
                    case 'UserId':
                        head += caap.makeTh({
                            text: headers[pp],
                            color: '',
                            id: '',
                            title: '',
                            width: '19%'
                        });
                        break;
                    case 'Name':
                        head += caap.makeTh({
                            text: headers[pp],
                            color: '',
                            id: '',
                            title: '',
                            width: '30%'
                        });
                        break;
                    case 'Duelchamp':
                        head += caap.makeTh({
                            text: headers[pp],
                            color: '',
                            id: '',
                            title: '',
                            width: '11%'
                        });
                        break;
                    case 'DCR':
                        head += caap.makeTh({
                            text: headers[pp],
                            color: '',
                            id: '',
                            title: '',
                            width: '5%'
                        });
                        break;
                    default:
                        head += caap.makeTh({
                            text: headers[pp],
                            color: '',
                            id: '',
                            title: '',
                            width: '7%'
                        });
                    }
                }

                head = caap.makeTr(head);
                for (i = 0, len = duelchamp.records.length; i < len; i += 1) {
                    row = "";
                    for (pp = 0, len1 = values.length; pp < len1; pp += 1) {
                        switch (values[pp]) {
                        case 'userId':
                            userIdLinkInstructions = "Clicking this link will take you to the user keep of " + duelchamp.records[i][values[pp]];
                            userIdLink = "keep.php?casuser=" + duelchamp.records[i][values[pp]];
                            data = {
                                text: '<span id="caap_duelchamp_' + i + '" title="' + userIdLinkInstructions + '" rlink="' + userIdLink +
                                    '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + duelchamp.records[i][values[pp]] + '</span>',
                                color: 'blue',
                                id: '',
                                title: ''
                            };

                            row += caap.makeTd(data);
                            break;
                        case 'duelchampNum':
                            row += caap.makeTd({
                                text: duelchamp.records[i][values[pp]],
                                color: '',
                                id: '',
                                title: duelchamp.records[i].rankStr
                            });
                            break;
                        case 'duelchampwinsNum':
                            row += caap.makeTd({
                                text: duelchamp.records[i][values[pp]] + "/" + duelchamp.records[i].invadelossesNum + " " + points(duelchamp.records[i].ibp),
                                color: '',
                                id: '',
                                title: ''
                            });
                            break;
                        default:
                            row += caap.makeTd({
                                text: duelchamp.records[i][values[pp]],
                                color: '',
                                id: '',
                                title: ''
                            });
                        }
                    }

                    body += caap.makeTr(row);
                }

                $j("#caap_infoDuelchamp", caap.caapTopObject).html(
                $j(caap.makeTable("duelchamp", head, body)).dataTable({
                    "bAutoWidth": false,
                    "bFilter": false,
                    "bJQueryUI": false,
                    "bInfo": false,
                    "bLengthChange": false,
                    "bPaginate": false,
                    "bProcessing": false,
                    "bStateSave": true,
                    "bSortClasses": false
                }));

                $j("span[id*='caap_duelchamp_']", caap.caapTopObject).click(function(e) {
                    var visitUserIdLink = {
                        rlink: '',
                        arlink: ''
                    },
                    i = 0,
                        len = 0;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'rlink') {
                            visitUserIdLink.rlink = e.target.attributes[i].nodeValue;
                            visitUserIdLink.arlink = visitUserIdLink.rlink;
                        }
                    }

                    caap.clickAjaxLinkSend(visitUserIdLink.arlink);
                });

                session.setItem("DuelchampDashUpdate", false);
            }

            return true;
        } catch (err) {
            con.error("ERROR in duelchamp.dashboard: " + err);
            return false;
        }
    };
}());
