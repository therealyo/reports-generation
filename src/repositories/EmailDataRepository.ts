import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, asc, eq, gte, lte } from "drizzle-orm/expressions";

import { emailDataTable } from "@/database/EmailDataTable";

class EmailDataRepository {
  constructor(private db: NodePgDatabase) {}

  public getUserActualDataForTimePeriod = async (
    userId: string,
    startDate: number,
    endDate: number
  ) => {
    const results = await this.db
      .select()
      .from(emailDataTable)
      .where(
        and(
          gte(emailDataTable.startDate, startDate),
          lte(emailDataTable.endDate, endDate),
          eq(emailDataTable.userId, userId)
        )
      )
      .orderBy(asc(emailDataTable.startDate))
      .execute();

    return results;
  };
}

export default EmailDataRepository;
