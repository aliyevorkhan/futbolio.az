from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class AdminApplicationsPagination(PageNumberPagination):
    """20 per page, per spec section 2 — scoped to the admin applications
    list only, not the global default other admin lists still use.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200
