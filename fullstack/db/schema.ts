import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const profiles = sqliteTable('profiles', {
 id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull(),
 role: text('role').notNull(), subject: text('subject').notNull().default(''), level: text('level').notNull().default('Universitario'),
 city: text('city').notNull().default(''), bio: text('bio').notNull().default(''), createdAt: text('created_at').notNull()
});
export const slots = sqliteTable('slots', {
 id: text('id').primaryKey(), tutorId: text('tutor_id').notNull().references(()=>profiles.id), start: text('start').notNull(),
 mode: text('mode').notNull(), location: text('location').notNull().default('')
}, t=>[uniqueIndex('tutor_hour').on(t.tutorId,t.start)]);
export const bookings = sqliteTable('bookings', {
 id:text('id').primaryKey(), slotId:text('slot_id').notNull().references(()=>slots.id), studentId:text('student_id').notNull().references(()=>profiles.id),
 start:text('start').notNull(), status:text('status').notNull().default('pending'), topic:text('topic').notNull(), room:text('room').notNull(), createdAt:text('created_at').notNull()
},t=>[uniqueIndex('one_active_booking_per_slot').on(t.slotId).where(sql`${t.status} IN ('pending','accepted','completed')`),
 uniqueIndex('student_active_hour').on(t.studentId,t.start).where(sql`${t.status} IN ('pending','accepted','completed')`)]);
export const reviews = sqliteTable('reviews',{
 id:text('id').primaryKey(),bookingId:text('booking_id').notNull().references(()=>bookings.id),score:integer('score').notNull(),comment:text('comment').notNull(),createdAt:text('created_at').notNull()
},t=>[uniqueIndex('one_review_per_booking').on(t.bookingId)]);
export const notifications=sqliteTable('notifications',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>profiles.id),message:text('message').notNull(),read:integer('read').notNull().default(0),createdAt:text('created_at').notNull()
});
