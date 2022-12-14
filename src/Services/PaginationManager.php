<?php

namespace App\Services;

use Doctrine\ORM\Query;
use Doctrine\ORM\QueryBuilder;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Symfony\Component\HttpFoundation\Request;

class PaginationManager
{
    /**
     * @param QueryBuilder|Query $query
     * @param Request $request
     * @param int $limit
     * @return Paginator
     */
    public function paginate($query, Request $request, int $limit): Paginator
    {
        $currentPage = (int) 1;

        if($request->request->get('page_id') != null) {

            $currentPage = (int) $request->request->get('page_id');
        }

        if($request->request->get('page-id') != null) {

            $currentPage = (int) $request->request->get('page-id');
        }

        if($request->get('page_id') != null) {

            $currentPage = (int) $request->get('page_id');
        }

        $paginator = new Paginator($query);
        $paginator
            ->getQuery()
            ->setFirstResult($limit * ($currentPage - 1))
            ->setMaxResults($limit);
        return $paginator;
    }

    /**
     * @param Paginator $paginator
     * @return int
     */
    public function lastPage(Paginator $paginator): int
    {
        return ceil($paginator->count() / $paginator->getQuery()->getMaxResults());
    }

    /**
     * @param Paginator $paginator
     * @return int
     */
    public function total(Paginator $paginator): int
    {
        return $paginator->count();
    }

    /**
     * @param Paginator $paginator
     * @return bool
     */
    public function currentPageHasNoResult(Paginator $paginator): bool
    {
        return !$paginator->getIterator()->count();
    }
}