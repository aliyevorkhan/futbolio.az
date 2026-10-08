from common.storage import delete_object

from .models import ApplicationFile


def delete_files_for_application(application) -> None:
    """Used by the `applications` app's admin hard-delete endpoint — removes
    every file (and thumbnail) belonging to `application` from object
    storage, then the DB rows.
    """
    queryset = ApplicationFile.objects.filter(application=application)
    for file_obj in queryset:
        delete_object(file_obj.storage_key)
        if file_obj.thumbnail_key:
            delete_object(file_obj.thumbnail_key)
    queryset.delete()
