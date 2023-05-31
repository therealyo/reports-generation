import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, gte, lte } from "drizzle-orm/expressions";

import { emailDataTable } from "@/database/EmailDataTable";
import { sql } from "drizzle-orm";

class EmailDataRepository {
  constructor(private db: NodePgDatabase) {}

  public getUserActualDataForTimePeriod = async (
    userId: string,
    startDate: number,
    endDate: number
  ) => {
    const user_data = this.db.$with("user_data").as(
      this.db
        .select()
        .from(emailDataTable)
        .where(
          and(
            gte(emailDataTable.startDate, startDate),
            lte(emailDataTable.endDate, endDate),
            eq(emailDataTable.userId, userId)
          )
        )
    );
    const results = await this.db
      .with(user_data)
      .select()
      .from(user_data)
      .where(
        sql`status='Moving' OR (status='Stopped' AND end_date - start_date > 360000)`
      );

    return results;
  };

  public getUsers = async () => {
    return await this.db
      .select({ userId: emailDataTable.userId })
      .from(emailDataTable)
      .execute()
      .then((users) => {
        return [
          ...new Set(
            users.map((user) => {
              return user.userId;
            })
          ),
        ];
      });
  };
}

export default EmailDataRepository;
