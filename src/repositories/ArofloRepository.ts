import { arofloTable } from "@/database/ArofloDataTable";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
// import { PgDatabase } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm/expressions";

class ArofloRepository {
  constructor(private db: NodePgDatabase) {}

  public getUserActualDataForTimePeriod = async (
    userId: string,
    startDate: number,
    endDate: number
  ) => {
    const results = await this.db
      .select()
      .from(arofloTable)
      .where(
        and(
          gte(arofloTable.startDate, startDate),
          lte(arofloTable.endDate, endDate),
          eq(arofloTable.userId, userId)
        )
      )
      .orderBy(asc(arofloTable.startDate))
      .execute();

    return results;
  };
}

export default ArofloRepository;
