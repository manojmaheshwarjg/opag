
import Airtable from 'airtable';

type AirtableParams = {
    apiKey: string;
    baseId: string;
    tableName: string;
}

type CreateRecordParams = AirtableParams & {
    fields: { [key: string]: any };
}

export const createRecord = async ({ apiKey, baseId, tableName, fields }: CreateRecordParams) => {
    const base = new Airtable({ apiKey }).base(baseId);
    
    const createdRecord = await base(tableName).create(fields);

    return createdRecord;
};
