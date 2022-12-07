<?php

namespace App\Repository;

use App\Entity\ListItems;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\OptimisticLockException;
use Doctrine\ORM\ORMException;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method ListItems|null find($id, $lockMode = null, $lockVersion = null)
 * @method ListItems|null findOneBy(array $criteria, array $orderBy = null)
 * @method ListItems[]    findAll()
 * @method ListItems[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ListItemsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ListItems::class);
    }

    /**
     * @throws ORMException
     * @throws OptimisticLockException
     */
    public function add(ListItems $entity, bool $flush = true): void
    {
        $this->_em->persist($entity);
        if ($flush) {
            $this->_em->flush();
        }
    }

    /**
     * @throws ORMException
     * @throws OptimisticLockException
     */
    public function remove(ListItems $entity, bool $flush = true): void
    {
        $this->_em->remove($entity);
        if ($flush) {
            $this->_em->flush();
        }
    }

    /**
    * @return ListItems[] Returns an array of ListItems objects
    */
    public function findByListId($listId)
    {
        $queryBuilder = $this->createQueryBuilder('li')
            ->select('li', 'l', 'p', 'd', 'dp', 'a')
            ->join('li.list', 'l')
            ->join('li.product', 'p')
            ->join('li.distributor', 'd')
            ->join('li.distributorProduct', 'dp')
            ->join('d.api', 'a')
            ->andWhere('li.list = :listId')
            ->setParameter('listId', $listId)
            ->andWhere("li.itemId != ''");

        return [$queryBuilder->getQuery(), $queryBuilder->getQuery()->getResult()];
    }

    public function findListItem($clinicId, $listId, $productId)
    {
        return $this->createQueryBuilder('li')
            ->select('li', 'l')
            ->join('li.list', 'l')
            ->andWhere('li.list = :listId')
            ->setParameter('listId', $listId)
            ->andWhere('li.product = :productId')
            ->setParameter('productId', $productId)
            ->andWhere('l.clinic = :clinicId')
            ->setParameter('clinicId', $clinicId)
            ->getQuery()->getResult();
    }

    /*
    public function findOneBySomeField($value): ?ListItems
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
