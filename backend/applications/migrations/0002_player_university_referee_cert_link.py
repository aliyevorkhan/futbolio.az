from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="playerdetails",
            name="university_name",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="playerdetails",
            name="course_year",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="refereedetails",
            name="certification_link",
            field=models.URLField(blank=True),
        ),
    ]
