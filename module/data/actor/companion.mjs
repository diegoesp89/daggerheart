import BaseDataActor from './base.mjs';
import DhLevelData from '../levelData.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import ActionField from '../fields/actionField.mjs';
import { adjustDice, adjustRange } from '../../helpers/utils.mjs';

export default class DhCompanion extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Sheets.Companion'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.companion',
            type: 'companion'
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            partner: new ForeignDocumentUUIDField({ type: 'Actor' }),
            resources: new fields.SchemaField({
                stress: new fields.SchemaField({
                    value: new fields.NumberField({ initial: 0, integer: true }),
                    bonus: new fields.NumberField({ initial: 0, integer: true }),
                    max: new fields.NumberField({ initial: 3, integer: true })
                }),
                hope: new fields.NumberField({ initial: 0, integer: true })
            }),
            evasion: new fields.SchemaField({
                value: new fields.NumberField({ required: true, min: 1, initial: 10, integer: true }),
                bonus: new fields.NumberField({ initial: 0, integer: true })
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    value: new fields.NumberField({ integer: true, initial: 0 }),
                    bonus: new fields.NumberField({ integer: true, initial: 0 })
                }),
                {
                    initial: {
                        experience1: { value: 2 },
                        experience2: { value: 2 }
                    }
                }
            ),
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    _id: foundry.utils.randomID(),
                    systemPath: 'attack',
                    type: 'attack',
                    range: 'melee',
                    target: {
                        type: 'any',
                        amount: 1
                    },
                    roll: {
                        type: 'weapon',
                        bonus: 0
                    },
                    damage: {
                        parts: [
                            {
                                multiplier: 'flat',
                                value: {
                                    dice: 'd6',
                                    multiplier: 'flat'
                                }
                            }
                        ]
                    }
                }
            }),
            levelData: new fields.EmbeddedDataField(DhLevelData)
        };
    }

    prepareBaseData() {
        const partnerSpellcastingModifier = this.partner?.system?.spellcastingModifiers?.main;
        const spellcastingModifier = this.partner?.system?.traits?.[partnerSpellcastingModifier]?.total;
        this.attack.roll.bonus = spellcastingModifier ?? 0; // Needs to expand on which modifier it is that should be used because of multiclassing;

        for (let levelKey in this.levelData.levelups) {
            const level = this.levelData.levelups[levelKey];
            for (let selection of level.selections) {
                switch (selection.type) {
                    case 'lightInTheDark':
                        this.resources.hope += selection.value;
                        break;
                    case 'vicious':
                        if (selection.data === 'damage') {
                            this.attack.damage.parts[0].value.dice = adjustDice(this.attack.damage.parts[0].value.dice);
                        } else {
                            this.attack.range = adjustRange(this.attack.range);
                        }
                        break;
                    case 'resilient':
                        this.resources.stress.bonus += selection.value;
                        break;
                    case 'aware':
                        this.evasion.bonus += selection.value;
                        break;
                    case 'intelligent':
                        Object.keys(this.experiences).forEach(key => {
                            const experience = this.experiences[key];
                            experience.bonus += selection.value;
                        });
                        break;
                }
            }
        }
    }

    prepareDerivedData() {
        for (var experienceKey in this.experiences) {
            var experience = this.experiences[experienceKey];
            experience.total = experience.value + experience.bonus;
        }

        this.resources.stress.maxTotal = this.resources.stress.max + this.resources.stress.bonus;
        this.evasion.total = this.evasion.value + this.evasion.bonus;
    }

    getRollData() {
        const data = super.getRollData();
        return {
            ...data
        };
    }

    _preDelete() {
        /* Null Character Companion field */
    }
}
