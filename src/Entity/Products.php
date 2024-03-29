<?php

namespace App\Entity;

use App\Repository\ProductsRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Table(name="products",indexes={
 *          @ORM\Index(name="name", columns={"name"}, flags={"fulltext"}),
 *          @ORM\Index(name="active_ingredient", columns={"active_ingredient"}, flags={"fulltext"}),
 *          @ORM\Index(name="description", columns={"description"}, flags={"fulltext"}),
 *        })
 * @ORM\Entity(repositoryClass=ProductsRepository::class)
 */
class Products
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\ManyToMany(targetEntity="App\Entity\Species", inversedBy="product", cascade={"remove"})
     * @ORM\JoinTable(name="products_species")
     */
    protected $productsSpecie;

    /**
     * @ORM\ManyToMany(targetEntity="App\Entity\Manufacturers", inversedBy="product", cascade={"remove"})
     * @ORM\JoinTable(name="product_manufacturers")
     */
    protected $productManufacturer;

    /**
     * @ORM\ManyToOne(targetEntity=SubCategories::class, inversedBy="products")
     */
    private $subCategory;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isPublished;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $activeIngredient;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $image;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $description;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $dosage;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $size;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $form;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $unit;

    /**
     * @ORM\Column(type="float")
     */
    private $unitPrice;

    /**
     * @ORM\Column(type="integer")
     */
    private $stockCount;

    /**
     * @ORM\Column(type="datetime")
     */
    private $modified;

    /**
     * @ORM\Column(type="datetime")
     */
    private $created;

    /**
     * @ORM\OneToMany(targetEntity=DistributorProducts::class, mappedBy="product")
     */
    private $distributorProducts;

    /**
     * @ORM\OneToMany(targetEntity=OrderItems::class, mappedBy="product")
     */
    private $orderItems;

    /**
     * @ORM\OneToMany(targetEntity=ProductNotes::class, mappedBy="product")
     */
    private $productNotes;

    /**
     * @ORM\OneToMany(targetEntity=ProductReviews::class, mappedBy="product")
     */
    private $productReviews;

    /**
     * @ORM\OneToMany(targetEntity=AvailabilityTracker::class, mappedBy="product")
     */
    private $availabilityTrackers;

    /**
     * @ORM\OneToMany(targetEntity=ListItems::class, mappedBy="product")
     */
    private $listItems;

    /**
     * @ORM\OneToMany(targetEntity=BasketItems::class, mappedBy="product")
     */
    private $basketItems;

    /**
     * @ORM\OneToMany(targetEntity=ClinicProducts::class, mappedBy="product")
     */
    private $clinicProducts;

    /**
     * @ORM\OneToMany(targetEntity=ProductFavourites::class, mappedBy="product")
     */
    private $productFavourites;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $sku;

    /**
     * @ORM\OneToMany(targetEntity=ProductManufacturers::class, mappedBy="products")
     */
    private $productManufacturers;

    /**
     * @ORM\ManyToMany(targetEntity=ProductsSpecies::class, mappedBy="products")
     */
    protected $productsSpecies;

    /**
     * @ORM\OneToMany(targetEntity=ProductImages::class, mappedBy="product")
     */
    private $productImages;

    /**
     * @ORM\Column(type="boolean")
     */
    private $expiryDateRequired;

    /**
     * @ORM\OneToMany(targetEntity=ProductsSpecies::class, mappedBy="products")
     */
    private $productSpecies;

    /**
     * @ORM\ManyToOne(targetEntity=Categories2::class, inversedBy="products")
     */
    private $category2;

    /**
     * @ORM\ManyToOne(targetEntity=Categories3::class, inversedBy="products")
     */
    private $category3;

    /**
     * @ORM\Column(type="json", nullable=true)
     */
    private $tags = [];

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $slug;

    /**
     * @ORM\ManyToOne(targetEntity=Categories1::class, inversedBy="products")
     */
    private $category;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isActive;

    /**
     * @ORM\Column(type="float", nullable=false)
     */
    private $priceFrom;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $dosageUnit;

    /**
     * @ORM\Column(type="json", nullable=true)
     */
    private $manufacturerIds = [];

    /**
     * @ORM\OneToMany(targetEntity=ProductRetail::class, mappedBy="product")
     */
    private $productRetails;

    /**
     * @ORM\Column(type="boolean", nullable=true)
     */
    private $isControlled;

    public function __construct()
    {
        $this->setCreated(new \DateTime());
        if ($this->getModified() == null) {
            $this->setModified(new \DateTime());
        }

        $this->distributorProducts = new ArrayCollection();
        $this->orderItems = new ArrayCollection();
        $this->productNotes = new ArrayCollection();
        $this->productReviews = new ArrayCollection();
        $this->availabilityTrackers = new ArrayCollection();
        $this->productsSpecies = new ArrayCollection();
        $this->listItems = new ArrayCollection();
        $this->basketItems = new ArrayCollection();
        $this->clinicProducts = new ArrayCollection();
        $this->productFavourites = new ArrayCollection();
        $this->productManufacturer = new ArrayCollection();
        $this->productManufacturers = new ArrayCollection();
        $this->productImages = new ArrayCollection();
        $this->productSpecies = new ArrayCollection();
        $this->productRetails = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSubCategory(): ?SubCategories
    {
        return $this->subCategory;
    }

    public function setSubCategory(?SubCategories $subCategory): self
    {
        $this->subCategory = $subCategory;

        return $this;
    }

    public function getIsPublished(): ?bool
    {
        return $this->isPublished;
    }

    public function setIsPublished(bool $isPublished): self
    {
        $this->isPublished = $isPublished;

        return $this;
    }

    public function getIsActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getActiveIngredient(): ?string
    {
        return $this->activeIngredient;
    }

    public function setActiveIngredient(string $activeIngredient): self
    {
        $this->activeIngredient = $activeIngredient;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): self
    {
        $this->image = $image;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getDosage(): ?string
    {
        return $this->dosage;
    }

    public function setDosage(?string $dosage): self
    {
        $this->dosage = $dosage;

        return $this;
    }

    public function getSize(): ?string
    {
        return $this->size;
    }

    public function setSize(?string $size): self
    {
        $this->size = $size;

        return $this;
    }

    public function getForm(): ?string
    {
        return $this->form;
    }

    public function setForm(string $form): self
    {
        $this->form = $form;

        return $this;
    }

    public function getUnit(): ?string
    {
        return $this->unit;
    }

    public function setUnit(string $unit): self
    {
        $this->unit = $unit;

        return $this;
    }

    public function getUnitPrice(): ?float
    {
        return $this->unitPrice;
    }

    public function setUnitPrice(float $unitPrice): self
    {
        $this->unitPrice = $unitPrice;

        return $this;
    }

    public function getStockCount(): ?int
    {
        return $this->stockCount;
    }

    public function setStockCount(int $stockCount): self
    {
        $this->stockCount = $stockCount;

        return $this;
    }

    public function getModified(): ?\DateTimeInterface
    {
        return $this->modified;
    }

    public function setModified(\DateTimeInterface $modified): self
    {
        $this->modified = $modified;

        return $this;
    }

    public function getCreated(): ?\DateTimeInterface
    {
        return $this->created;
    }

    public function setCreated(\DateTimeInterface $created): self
    {
        $this->created = $created;

        return $this;
    }

    /**
     * @return Collection|DistributorProducts[]
     */
    public function getDistributorProducts(): Collection
    {
        return $this->distributorProducts;
    }

    public function addDistributorProduct(DistributorProducts $distributorProduct): self
    {
        if (!$this->distributorProducts->contains($distributorProduct)) {
            $this->distributorProducts[] = $distributorProduct;
            $distributorProduct->setProduct($this);
        }

        return $this;
    }

    public function removeDistributorProduct(DistributorProducts $distributorProduct): self
    {
        if ($this->distributorProducts->removeElement($distributorProduct)) {
            // set the owning side to null (unless already changed)
            if ($distributorProduct->getProduct() === $this) {
                $distributorProduct->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection|OrderItems[]
     */
    public function getOrderItems(): Collection
    {
        return $this->orderItems;
    }

    public function addOrderItem(OrderItems $orderItem): self
    {
        if (!$this->orderItems->contains($orderItem)) {
            $this->orderItems[] = $orderItem;
            $orderItem->setProduct($this);
        }

        return $this;
    }

    public function removeOrderItem(OrderItems $orderItem): self
    {
        if ($this->orderItems->removeElement($orderItem)) {
            // set the owning side to null (unless already changed)
            if ($orderItem->getProduct() === $this) {
                $orderItem->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection|ProductNotes[]
     */
    public function getProductNotes(): Collection
    {
        return $this->productNotes;
    }

    public function addProductNote(ProductNotes $productNote): self
    {
        if (!$this->productNotes->contains($productNote)) {
            $this->productNotes[] = $productNote;
            $productNote->setProduct($this);
        }

        return $this;
    }

    public function removeProductNote(ProductNotes $productNote): self
    {
        if ($this->productNotes->removeElement($productNote)) {
            // set the owning side to null (unless already changed)
            if ($productNote->getProduct() === $this) {
                $productNote->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection|ProductReviews[]
     */
    public function getProductReviews(): Collection
    {
        return $this->productReviews;
    }

    public function addProductReview(ProductReviews $productReview): self
    {
        if (!$this->productReviews->contains($productReview)) {
            $this->productReviews[] = $productReview;
            $productReview->setProduct($this);
        }

        return $this;
    }

    public function removeProductReview(ProductReviews $productReview): self
    {
        if ($this->productReviews->removeElement($productReview)) {
            // set the owning side to null (unless already changed)
            if ($productReview->getProduct() === $this) {
                $productReview->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection|AvailabilityTracker[]
     */
    public function getAvailabilityTrackers(): Collection
    {
        return $this->availabilityTrackers;
    }

    public function addAvailabilityTracker(AvailabilityTracker $availabilityTracker): self
    {
        if (!$this->availabilityTrackers->contains($availabilityTracker)) {
            $this->availabilityTrackers[] = $availabilityTracker;
            $availabilityTracker->setProduct($this);
        }

        return $this;
    }

    public function removeAvailabilityTracker(AvailabilityTracker $availabilityTracker): self
    {
        if ($this->availabilityTrackers->removeElement($availabilityTracker)) {
            // set the owning side to null (unless already changed)
            if ($availabilityTracker->getProduct() === $this) {
                $availabilityTracker->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection|Species[]
     */
    public function getProductsSpecies(): Collection
    {
        return $species = $this->productsSpecies;
    }

    public function addProductsSpecies(Species $productsSpecies): self
    {
        if (!$this->productsSpecies->contains($productsSpecies)) {
            $this->productsSpecies[] = $productsSpecies;
            $productsSpecies->addProducts($this);
        }

        return $this;
    }

    public function removeProductsSpecies(Species $productsSpecies): self
    {
        if ($this->productsSpecies->removeElement($productsSpecies)) {
            $productsSpecies->removeProducts($this);
        }

        return $this;
    }

    /**
     * @return Collection|Manufacturers[]
     */
    public function getProductManufacturer(): Collection
    {
        return $manufacturers = $this->productManufacturer;
    }

    public function addProductManufacturer(Manufacturers $productManufacturer): self
    {
        if (!$this->productManufacturer->contains($productManufacturer)) {
            $this->productManufacturer[] = $productManufacturer;
            $productManufacturer->addProduct($this);
        }

        return $this;
    }

    public function removeProductManufacturer(Manufacturers $productManufacturer): self
    {
        if ($this->productManufacturer->removeElement($productManufacturer)) {
            $productManufacturer->removeProducts($this);
        }

        return $this;
    }

    /**
     * @return Collection<int, ListItems>
     */
    public function getListItems(): Collection
    {
        return $this->listItems;
    }

    public function addListItem(ListItems $listItem): self
    {
        if (!$this->listItems->contains($listItem)) {
            $this->listItems[] = $listItem;
            $listItem->setProduct($this);
        }

        return $this;
    }

    public function removeListItem(ListItems $listItem): self
    {
        if ($this->listItems->removeElement($listItem)) {
            // set the owning side to null (unless already changed)
            if ($listItem->getProduct() === $this) {
                $listItem->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BasketItems>
     */
    public function getBasketItems(): Collection
    {
        return $this->basketItems;
    }

    public function addBasketItem(BasketItems $basketItem): self
    {
        if (!$this->basketItems->contains($basketItem)) {
            $this->basketItems[] = $basketItem;
            $basketItem->setProduct($this);
        }

        return $this;
    }

    public function removeBasketItem(BasketItems $basketItem): self
    {
        if ($this->basketItems->removeElement($basketItem)) {
            // set the owning side to null (unless already changed)
            if ($basketItem->getProduct() === $this) {
                $basketItem->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ClinicProducts>
     */
    public function getClinicProducts(): Collection
    {
        return $this->clinicProducts;
    }

    public function addClinicProduct(ClinicProducts $clinicProduct): self
    {
        if (!$this->clinicProducts->contains($clinicProduct)) {
            $this->clinicProducts[] = $clinicProduct;
            $clinicProduct->setProduct($this);
        }

        return $this;
    }

    public function removeClinicProduct(ClinicProducts $clinicProduct): self
    {
        if ($this->clinicProducts->removeElement($clinicProduct)) {
            // set the owning side to null (unless already changed)
            if ($clinicProduct->getProduct() === $this) {
                $clinicProduct->setProduct(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ProductFavourites>
     */
    public function getProductFavourites(): Collection
    {
        return $this->productFavourites;
    }

    public function addProductFavourite(ProductFavourites $productFavourite): self
    {
        if (!$this->productFavourites->contains($productFavourite)) {
            $this->productFavourites[] = $productFavourite;
            $productFavourite->setProduct($this);
        }

        return $this;
    }

    public function removeProductFavourite(ProductFavourites $productFavourite): self
    {
        if ($this->productFavourites->removeElement($productFavourite)) {
            // set the owning side to null (unless already changed)
            if ($productFavourite->getProduct() === $this) {
                $productFavourite->setProduct(null);
            }
        }

        return $this;
    }

    public function getSku(): ?string
    {
        return $this->sku;
    }

    public function setSku(?string $sku): self
    {
        $this->sku = $sku;

        return $this;
    }

    /**
     * @return Collection<int, ProductManufacturers>
     */
    public function getProductManufacturers(): Collection
    {
        return $this->productManufacturers;
    }

    /**
     * @return Collection<int, ProductImages>
     */
    public function getProductImages(): Collection
    {
        return $this->productImages;
    }

    public function addProductImage(ProductImages $productImage): self
    {
        if (!$this->productImages->contains($productImage)) {
            $this->productImages[] = $productImage;
            $productImage->setProduct($this);
        }

        return $this;
    }

    public function removeProductImage(ProductImages $productImage): self
    {
        if ($this->productImages->removeElement($productImage)) {
            // set the owning side to null (unless already changed)
            if ($productImage->getProduct() === $this) {
                $productImage->setProduct(null);
            }
        }

        return $this;
    }

    public function getExpiryDateRequired(): ?bool
    {
        return $this->expiryDateRequired;
    }

    public function setExpiryDateRequired(bool $expiryDateRequired): self
    {
        $this->expiryDateRequired = $expiryDateRequired;

        return $this;
    }

    /**
     * @return Collection<int, ProductsSpecies>
     */
    public function getProductSpecies(): Collection
    {
        return $this->productSpecies;
    }

    public function addProductSpecies(ProductsSpecies $productSpecies): self
    {
        if (!$this->productSpecies->contains($productSpecies)) {
            $this->productSpecies[] = $productSpecies;
            $productSpecies->setProducts($this);
        }

        return $this;
    }

    public function removeProductSpecies(ProductsSpecies $productSpecies): self
    {
        if ($this->productSpecies->removeElement($productSpecies)) {
            // set the owning side to null (unless already changed)
            if ($productSpecies->getProducts() === $this) {
                $productSpecies->setProducts(null);
            }
        }

        return $this;
    }

    public function getCategory2(): ?Categories2
    {
        return $this->category2;
    }

    public function setCategory2(?Categories2 $category2): self
    {
        $this->category2 = $category2;

        return $this;
    }

    public function getCategory3(): ?Categories3
    {
        return $this->category3;
    }

    public function setCategory3(?Categories3 $category3): self
    {
        $this->category3 = $category3;

        return $this;
    }

    public function getTags(): ?array
    {
        return $this->tags;
    }

    public function setTags(?array $tags): self
    {
        $this->tags = $tags;

        return $this;
    }

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(?string $slug): self
    {
        $this->slug = $slug;

        return $this;
    }

    public function getCategory(): ?Categories1
    {
        return $this->category;
    }

    public function setCategory(?Categories1 $category): self
    {
        $this->category = $category;

        return $this;
    }

    public function getPriceFrom(): ?float
    {
        return $this->priceFrom;
    }

    public function setPriceFrom(float $priceFrom): self
    {
        $this->priceFrom = $priceFrom;

        return $this;
    }

    public function getDosageUnit(): ?string
    {
        return $this->dosageUnit;
    }

    public function setDosageUnit(?string $dosageUnit): self
    {
        $this->dosageUnit = $dosageUnit;

        return $this;
    }

    public function getManufacturerIds(): ?array
    {
        return $this->manufacturerIds;
    }

    public function setManufacturerIds(?array $manufacturerIds): self
    {
        $this->manufacturerIds = $manufacturerIds;

        return $this;
    }

    /**
     * @return Collection<int, ProductRetail>
     */
    public function getProductRetails(): Collection
    {
        return $this->productRetails;
    }

    public function addProductRetail(ProductRetail $productRetail): self
    {
        if (!$this->productRetails->contains($productRetail)) {
            $this->productRetails[] = $productRetail;
            $productRetail->setProduct($this);
        }

        return $this;
    }

    public function removeProductRetail(ProductRetail $productRetail): self
    {
        if ($this->productRetails->removeElement($productRetail)) {
            // set the owning side to null (unless already changed)
            if ($productRetail->getProduct() === $this) {
                $productRetail->setProduct(null);
            }
        }

        return $this;
    }

    public function getIsControlled(): ?bool
    {
        return $this->isControlled;
    }

    public function setIsControlled(?bool $isControlled): self
    {
        $this->isControlled = $isControlled;

        return $this;
    }
}
