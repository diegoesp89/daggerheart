import BaseDataActor from './base.mjs';
import DhLevelData from '../levelData.mjs';
import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';

export default class DhCompanion extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Sheets.Companion'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.companion',
            type: 'character'
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
                })
            }),
            evasion: new fields.SchemaField({
                value: new fields.NumberField({ required: true, min: 1, initial: 10, integer: true }),
                bonus: new fields.NumberField({ initial: 0, integer: true })
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    description: new fields.StringField({}),
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
            attack: new fields.SchemaField({
                name: new fields.StringField({}),
                range: new fields.StringField({
                    required: true,
                    choices: SYSTEM.GENERAL.range,
                    initial: SYSTEM.GENERAL.range.melee.id
                }),
                damage: new fields.SchemaField({
                    value: new fields.StringField({ initial: 'd6' }),
                    type: new fields.StringField({
                        required: true,
                        choices: SYSTEM.GENERAL.damageTypes,
                        initial: SYSTEM.GENERAL.damageTypes.physical.id
                    })
                })
            }),
            levelData: new fields.EmbeddedDataField(DhLevelData)
        };
    }

    prepareBaseData() {
        this.attack.modifier = this.partner?.system?.spellcastingModifiers?.main ?? 0; // Needs to expand on which modifier it is that should be used because of multiclassing;
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
}
